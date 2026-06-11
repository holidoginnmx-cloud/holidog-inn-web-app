"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, ERROR_GENERICO, validar, withSupabase, type DB } from "@/lib/actions";
import { reservacionInputSchema } from "@/lib/validations/reservacion";
import { servicioToType, estadoToStatus } from "@/lib/labels";
import { timestampDeFecha } from "@/lib/reservacion";

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

    revalidatePath("/reservaciones");
    revalidatePath(`/perros/${v.data.perro_id}`);
    return { ok: true, data: { id } };
  });
}

// Elimina una reservación (cascada borra sus pagos por FK).
export async function eliminarReservacion(id: string): Promise<ActionResult<null>> {
  return withSupabase("reservaciones", async (supabase) => {
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
