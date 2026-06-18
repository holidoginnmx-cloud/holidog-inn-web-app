"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, ERROR_GENERICO, validar, withSupabase, type DB } from "@/lib/actions";
import { reservacionInputSchema } from "@/lib/validations/reservacion";
import { servicioToType, estadoToStatus } from "@/lib/labels";
import { timestampDeFecha } from "@/lib/reservacion";
import { bathSizeKey } from "@/lib/estetica";
import { one } from "@/lib/supabase/helpers";
import type { Enums } from "@/lib/supabase/types";

type ReservacionData = ReturnType<typeof reservacionInputSchema.parse>;

// Construye el row (columnas inglesas) para insert/update de `reservations`.
// STAY: usa checkIn/checkOut. ESTETICA/GUARDERIA: van en appointmentAt (de un
// día) y checkIn/checkOut quedan null. Los timestamps se anclan a mediodía UTC
// (timestampDeFecha) para no correr el día por zona horaria; no guardamos hora.
function aRow(data: ReservacionData, ownerId: string) {
  const tipo = servicioToType(data.servicio);
  const esStay = data.servicio === "HOTEL";
  return {
    petId: data.perro_id,
    ownerId,
    reservationType: tipo,
    checkIn: esStay ? timestampDeFecha(data.fecha_inicio) : null,
    checkOut: esStay ? timestampDeFecha(data.fecha_fin) : null,
    appointmentAt: esStay ? null : timestampDeFecha(data.fecha_inicio),
    totalAmount: data.precio_acordado ?? 0,
    depositAgreed: data.anticipo_acordado ?? null,
    status: estadoToStatus(data.estado),
    notes: data.notas ?? null,
    updatedAt: new Date().toISOString(),
  };
}

// Busca el dueño (ownerId) del perro. La reserva nueva lo requiere (NOT NULL).
async function buscarOwnerId(supabase: DB, petId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("pets")
    .select("ownerId")
    .eq("id", petId)
    .maybeSingle();
  if (error || !data) {
    console.error("[reservaciones] No se pudo resolver el dueño del perro:", error);
    return null;
  }
  return data.ownerId;
}

// Sincroniza el baño (y sus flags corte/deslanado) de una reservación con la
// tabla `reservation_addons`, reutilizando el modelo compartido con la app
// móvil. El baño = un addon que apunta a una `service_variant` de tipo BATH.
//
// - baño OFF → borra el addon BATH si existe.
// - baño ON  → resuelve la variante (talla del perro + corte + deslanado) y
//   crea el addon, o actualiza el existente (solo variantId + unitPrice; se
//   preservan los campos `extra*`/`paymentId` que define el staff en móvil).
//
// Nunca bloquea el guardado de la reserva: si algo falla, se loguea y se sigue.
async function sincronizarBano(
  supabase: DB,
  reservationId: string,
  data: ReservacionData,
): Promise<void> {
  try {
    // Addon BATH existente (si lo hay).
    const { data: addons } = await supabase
      .from("reservation_addons")
      .select("id, variant:service_variants(serviceType:service_types(code))")
      .eq("reservationId", reservationId);
    const existente = (addons ?? []).find((a) => one(one(a.variant)?.serviceType)?.code === "BATH");

    if (!data.incluye_bano) {
      if (existente) {
        const { error } = await supabase.from("reservation_addons").delete().eq("id", existente.id);
        if (error) console.error("[reservaciones] Error al borrar addon de baño:", error);
      }
      return;
    }

    // Talla del perro para elegir la variante de baño.
    const { data: pet } = await supabase
      .from("pets")
      .select("size, weight")
      .eq("id", data.perro_id)
      .maybeSingle();
    const size = bathSizeKey((pet?.size as Enums<"PetSize"> | null) ?? null, pet?.weight ?? null);

    // Variante BATH para (talla, corte, deslanado).
    const { data: variantes } = await supabase
      .from("service_variants")
      .select("id, price, isActive, serviceType:service_types(code)")
      .eq("petSize", size)
      .eq("corte", data.incluye_corte)
      .eq("deslanado", data.incluye_deslanado);
    const variant = (variantes ?? []).find(
      (v) => one(v.serviceType)?.code === "BATH" && v.isActive !== false,
    );
    if (!variant) {
      console.error(
        `[reservaciones] No se encontró variante de baño (talla=${size}, corte=${data.incluye_corte}, deslanado=${data.incluye_deslanado}); se omite el baño.`,
      );
      return;
    }

    if (existente) {
      const { error } = await supabase
        .from("reservation_addons")
        .update({ variantId: variant.id, unitPrice: variant.price })
        .eq("id", existente.id);
      if (error) console.error("[reservaciones] Error al actualizar addon de baño:", error);
    } else {
      const { error } = await supabase.from("reservation_addons").insert({
        id: crypto.randomUUID(),
        reservationId,
        variantId: variant.id,
        unitPrice: variant.price,
        paidWith: "BOOKING",
        paymentId: null,
      });
      if (error) console.error("[reservaciones] Error al crear addon de baño:", error);
    }
  } catch (e) {
    console.error("[reservaciones] Error inesperado al sincronizar el baño:", e);
  }
}

export async function crearReservacion(input: unknown): Promise<ActionResult<{ id: string }>> {
  const v = validar(reservacionInputSchema, input);
  if (!v.ok) return v;

  return withSupabase("reservaciones", async (supabase) => {
    const ownerId = await buscarOwnerId(supabase, v.data.perro_id);
    if (!ownerId) return { ok: false, error: ERROR_GENERICO };

    const id = crypto.randomUUID();
    const { data: row, error } = await supabase
      .from("reservations")
      .insert({ id, ...aRow(v.data, ownerId) })
      .select("id")
      .single();
    if (error || !row) {
      console.error("[reservaciones] Error al crear:", error);
      return { ok: false, error: ERROR_GENERICO };
    }

    // El anticipo se registra como un pago (kind ANTICIPO) para que cuente en el
    // total pagado: así el saldo = totalAmount − anticipo y el badge de pago sale
    // correcto. Si falla, se revierte la reservación para no dejar el dato a
    // medias (sin transacciones nativas en el cliente de Supabase).
    const anticipo = v.data.anticipo_acordado;
    if (anticipo != null && anticipo > 0) {
      const { error: pagoErr } = await supabase.from("payments").insert({
        id: crypto.randomUUID(),
        reservationId: row.id,
        amount: anticipo,
        kind: "ANTICIPO",
        method: "CASH",
        status: "PAID",
        paidAt: timestampDeFecha(v.data.fecha_inicio),
      });
      if (pagoErr) {
        console.error("[reservaciones] Error al crear el pago de anticipo:", pagoErr);
        await supabase.from("reservations").delete().eq("id", row.id);
        return { ok: false, error: ERROR_GENERICO };
      }
    }

    await sincronizarBano(supabase, row.id, v.data);

    revalidatePath("/reservaciones");
    revalidatePath("/movimientos");
    revalidatePath(`/perros/${v.data.perro_id}`);
    return { ok: true, data: { id: row.id } };
  });
}

export async function actualizarReservacion(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const v = validar(reservacionInputSchema, input);
  if (!v.ok) return v;

  return withSupabase("reservaciones", async (supabase) => {
    const ownerId = await buscarOwnerId(supabase, v.data.perro_id);
    if (!ownerId) return { ok: false, error: ERROR_GENERICO };

    const { error } = await supabase
      .from("reservations")
      .update(aRow(v.data, ownerId))
      .eq("id", id);
    if (error) {
      console.error("[reservaciones] Error al actualizar:", error);
      return { ok: false, error: ERROR_GENERICO };
    }

    await sincronizarBano(supabase, id, v.data);

    revalidatePath("/reservaciones");
    revalidatePath(`/perros/${v.data.perro_id}`);
    return { ok: true, data: { id } };
  });
}

// Elimina una reservación y todas sus filas dependientes.
// La DB es compartida con la app móvil y sus FK (camelCase) NO tienen
// ON DELETE CASCADE, así que hay que borrar los hijos a mano antes de la
// reservación o el delete falla por constraint. `reservation_addons` referencia
// a `payments` (paymentId), por eso va primero. Borrar de una tabla vacía es un
// no-op inofensivo: incluimos las tablas de la app móvil para no romper a futuro.
export async function eliminarReservacion(id: string): Promise<ActionResult<null>> {
  return withSupabase("reservaciones", async (supabase) => {
    const hijos: {
      etiqueta: string;
      ejecutar: PromiseLike<{ error: { message: string } | null }>;
    }[] = [
      {
        etiqueta: "reservation_addons",
        ejecutar: supabase.from("reservation_addons").delete().eq("reservationId", id),
      },
      {
        etiqueta: "payments",
        ejecutar: supabase.from("payments").delete().eq("reservationId", id),
      },
      {
        etiqueta: "daily_checklists",
        ejecutar: supabase.from("daily_checklists").delete().eq("reservationId", id),
      },
      { etiqueta: "reviews", ejecutar: supabase.from("reviews").delete().eq("reservationId", id) },
      {
        etiqueta: "staff_alerts",
        ejecutar: supabase.from("staff_alerts").delete().eq("reservationId", id),
      },
      {
        etiqueta: "stay_updates",
        ejecutar: supabase.from("stay_updates").delete().eq("reservationId", id),
      },
      {
        etiqueta: "reservation_change_requests",
        ejecutar: supabase.from("reservation_change_requests").delete().eq("reservationId", id),
      },
    ];
    for (const { etiqueta, ejecutar } of hijos) {
      const { error } = await ejecutar;
      if (error) {
        console.error(`[reservaciones] Error al borrar ${etiqueta}:`, error);
        return { ok: false, error: ERROR_GENERICO };
      }
    }

    const { error } = await supabase.from("reservations").delete().eq("id", id);
    if (error) {
      console.error("[reservaciones] Error al eliminar:", error);
      return { ok: false, error: ERROR_GENERICO };
    }
    revalidatePath("/reservaciones");
    revalidatePath("/");
    return { ok: true, data: null };
  });
}
