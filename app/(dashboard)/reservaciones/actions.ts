"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, ERROR_GENERICO, validar, withSupabase, type DB } from "@/lib/actions";
import { reservacionInputSchema, horasReservacionSchema } from "@/lib/validations/reservacion";
import { servicioToType, estadoToStatus } from "@/lib/labels";
import { timestampDeFecha } from "@/lib/reservacion";

type ReservacionData = ReturnType<typeof reservacionInputSchema.parse>;

// Combina una fecha "YYYY-MM-DD" con una hora "HH:MM" (UTC) en un timestamp ISO.
// Si no hay hora, ancla a mediodía UTC (timestampDeFecha) para no correr el día.
// DECISIÓN: la hora se guarda dentro del propio timestamp de checkIn/checkOut
// (reservations no tiene columnas de hora separadas como el legacy).
function tsConHora(fecha: string | null | undefined, hora: string | null | undefined): string | null {
  if (!fecha) return null;
  if (!hora) return timestampDeFecha(fecha);
  const soloFecha = fecha.slice(0, 10);
  return `${soloFecha}T${hora.slice(0, 5)}:00.000Z`;
}

// Construye el row (columnas inglesas) para insert/update de `reservations`.
// STAY: usa checkIn/checkOut. ESTETICA/GUARDERIA: van en appointmentAt (de un
// día) y checkIn/checkOut quedan null.
function aRow(data: ReservacionData, ownerId: string) {
  const tipo = servicioToType(data.servicio);
  const esStay = data.servicio === "HOTEL";
  return {
    petId: data.perro_id,
    ownerId,
    reservationType: tipo,
    checkIn: esStay ? tsConHora(data.fecha_inicio, data.hora_check_in) : null,
    checkOut: esStay ? tsConHora(data.fecha_fin, data.hora_check_out) : null,
    appointmentAt: esStay ? null : tsConHora(data.fecha_inicio, data.hora_check_in),
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

// Editor rápido del calendario: actualiza solo la hora de check-in/out.
// Recombina la hora con la fecha vigente del timestamp (la hora se guarda dentro
// del propio checkIn/checkOut). `perroId` es opcional; si llega, revalida la
// ficha del perro.
export async function actualizarHorasReservacion(
  id: string,
  input: unknown,
  perroId?: string,
): Promise<ActionResult<{ id: string }>> {
  const v = validar(horasReservacionSchema, input);
  if (!v.ok) return v;

  return withSupabase("reservaciones", async (supabase) => {
    // Necesitamos la fecha vigente de checkIn/checkOut para recombinarla con la
    // nueva hora sin perder el día.
    const { data: cur, error: curErr } = await supabase
      .from("reservations")
      .select("checkIn, checkOut")
      .eq("id", id)
      .maybeSingle();
    if (curErr || !cur) {
      console.error("[reservaciones] Error al cargar horas:", curErr);
      return { ok: false, error: ERROR_GENERICO };
    }

    const patch: { checkIn?: string | null; checkOut?: string | null; updatedAt: string } = {
      updatedAt: new Date().toISOString(),
    };
    if (cur.checkIn) patch.checkIn = tsConHora(cur.checkIn, v.data.hora_check_in);
    if (cur.checkOut) patch.checkOut = tsConHora(cur.checkOut, v.data.hora_check_out);

    const { error } = await supabase.from("reservations").update(patch).eq("id", id);
    if (error) {
      console.error("[reservaciones] Error al actualizar horas:", error);
      return { ok: false, error: ERROR_GENERICO };
    }

    revalidatePath("/reservaciones");
    if (perroId) revalidatePath(`/perros/${perroId}`);
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
