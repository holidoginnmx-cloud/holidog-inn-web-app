"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, ERROR_GENERICO, validar, withSupabase } from "@/lib/actions";
import { reservacionInputSchema, horasReservacionSchema } from "@/lib/validations/reservacion";

// Construye el row para insert/update. ESTETICA/GUARDERIA son de un día → fin null.
function aRow(data: ReturnType<typeof reservacionInputSchema.parse>) {
  return {
    perro_id: data.perro_id,
    servicio: data.servicio,
    fecha_inicio: data.fecha_inicio,
    fecha_fin: data.servicio === "HOTEL" ? data.fecha_fin : null,
    hora_check_in: data.hora_check_in,
    hora_check_out: data.hora_check_out,
    precio_acordado: data.precio_acordado,
    anticipo_acordado: data.anticipo_acordado,
    estado: data.estado,
    notas: data.notas,
  };
}

export async function crearReservacion(input: unknown): Promise<ActionResult<{ id: string }>> {
  const v = validar(reservacionInputSchema, input);
  if (!v.ok) return v;

  return withSupabase("reservaciones", async (supabase) => {
    const { data: row, error } = await supabase
      .from("reservaciones")
      .insert(aRow(v.data))
      .select("id")
      .single();
    if (error || !row) {
      console.error("[reservaciones] Error al crear:", error);
      return { ok: false, error: ERROR_GENERICO };
    }

    // El anticipo se registra como un pago (tipo ANTICIPO) para que cuente en el
    // total pagado: así el saldo = precio_acordado − anticipo y el badge de pago
    // sale correcto. Si falla, se revierte la reservación para no dejar el dato a
    // medias (sin transacciones nativas en el cliente de Supabase).
    const anticipo = v.data.anticipo_acordado;
    if (anticipo != null && anticipo > 0) {
      const { error: pagoErr } = await supabase.from("pagos").insert({
        reservacion_id: row.id,
        monto: anticipo,
        tipo: "ANTICIPO",
        fecha: v.data.fecha_inicio,
      });
      if (pagoErr) {
        console.error("[reservaciones] Error al crear el pago de anticipo:", pagoErr);
        await supabase.from("reservaciones").delete().eq("id", row.id);
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
    const { error } = await supabase.from("reservaciones").update(aRow(v.data)).eq("id", id);
    if (error) {
      console.error("[reservaciones] Error al actualizar:", error);
      return { ok: false, error: ERROR_GENERICO };
    }

    revalidatePath("/reservaciones");
    revalidatePath(`/perros/${v.data.perro_id}`);
    return { ok: true, data: { id } };
  });
}

// Editor rápido del calendario: actualiza solo las horas de check-in/out.
// `perroId` es opcional; si llega, se revalida también la ficha del perro.
export async function actualizarHorasReservacion(
  id: string,
  input: unknown,
  perroId?: string,
): Promise<ActionResult<{ id: string }>> {
  const v = validar(horasReservacionSchema, input);
  if (!v.ok) return v;

  return withSupabase("reservaciones", async (supabase) => {
    const { error } = await supabase
      .from("reservaciones")
      .update({ hora_check_in: v.data.hora_check_in, hora_check_out: v.data.hora_check_out })
      .eq("id", id);
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
    const { error } = await supabase.from("reservaciones").delete().eq("id", id);
    if (error) {
      console.error("[reservaciones] Error al eliminar:", error);
      return { ok: false, error: ERROR_GENERICO };
    }
    revalidatePath("/reservaciones");
    revalidatePath("/");
    return { ok: true, data: null };
  });
}
