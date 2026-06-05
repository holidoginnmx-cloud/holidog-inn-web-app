"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, ERROR_GENERICO, validar, withSupabase } from "@/lib/actions";
import { pagoInputSchema, pagoUpdateSchema } from "@/lib/validations/pago";
import { egresoInputSchema } from "@/lib/validations/egreso";
import type { Servicio, ReservacionEstado } from "@/lib/labels";
import { sumarPagos } from "@/lib/reservacion";

export type ReservacionAbierta = {
  id: string;
  servicio: Servicio;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: ReservacionEstado;
  precio_acordado: number;
  pagado: number;
};

// --------------------------------------------------------------------------
// Ingreso (Pago). Si reservacion_id === "nueva", crea la reservación primero.
// --------------------------------------------------------------------------
export async function crearPago(input: unknown): Promise<ActionResult<{ pagoId: string }>> {
  const v = validar(pagoInputSchema, input);
  if (!v.ok) return v;
  const { perro_id, reservacion_id, servicio, monto, tipo, fecha, notas } = v.data;

  return withSupabase("movimientos", async (supabase) => {
    let reservacionId = reservacion_id;

    if (reservacion_id === "nueva") {
      // El precio acordado arranca igual al monto; el dueño lo ajusta después.
      const { data: resv, error: resvErr } = await supabase
        .from("reservaciones")
        .insert({
          perro_id,
          servicio: servicio as Servicio,
          fecha_inicio: fecha,
          precio_acordado: monto,
          estado: "RESERVADA",
        })
        .select("id")
        .single();
      if (resvErr || !resv) {
        console.error("[movimientos] Error al crear reservación:", resvErr);
        return { ok: false, error: ERROR_GENERICO };
      }
      reservacionId = resv.id;
    }

    const { data: pago, error: pagoErr } = await supabase
      .from("pagos")
      .insert({ reservacion_id: reservacionId, monto, tipo, fecha, descripcion: notas })
      .select("id")
      .single();
    if (pagoErr || !pago) {
      console.error("[movimientos] Error al crear pago:", pagoErr);
      return { ok: false, error: ERROR_GENERICO };
    }

    revalidatePath("/movimientos");
    revalidatePath(`/perros/${perro_id}`);
    return { ok: true, data: { pagoId: pago.id } };
  });
}

// --------------------------------------------------------------------------
// Egreso.
// --------------------------------------------------------------------------
export async function crearEgreso(input: unknown): Promise<ActionResult<{ egresoId: string }>> {
  const v = validar(egresoInputSchema, input);
  if (!v.ok) return v;

  return withSupabase("movimientos", async (supabase) => {
    const { data: egreso, error } = await supabase
      .from("egresos")
      .insert(v.data)
      .select("id")
      .single();
    if (error || !egreso) {
      console.error("[movimientos] Error al crear egreso:", error);
      return { ok: false, error: ERROR_GENERICO };
    }

    revalidatePath("/movimientos");
    return { ok: true, data: { egresoId: egreso.id } };
  });
}

// --------------------------------------------------------------------------
// Editar pago / egreso existentes (desde la lista de movimientos).
// --------------------------------------------------------------------------
export async function actualizarPago(
  id: string,
  input: unknown,
): Promise<ActionResult<{ pagoId: string }>> {
  const v = validar(pagoUpdateSchema, input);
  if (!v.ok) return v;
  const { monto, tipo, fecha, notas } = v.data;

  return withSupabase("movimientos", async (supabase) => {
    const { error } = await supabase
      .from("pagos")
      .update({ monto, tipo, fecha, descripcion: notas })
      .eq("id", id);
    if (error) {
      console.error("[movimientos] Error al actualizar pago:", error);
      return { ok: false, error: ERROR_GENERICO };
    }

    revalidatePath("/movimientos");
    revalidatePath("/");
    return { ok: true, data: { pagoId: id } };
  });
}

export async function actualizarEgreso(
  id: string,
  input: unknown,
): Promise<ActionResult<{ egresoId: string }>> {
  const v = validar(egresoInputSchema, input);
  if (!v.ok) return v;

  return withSupabase("movimientos", async (supabase) => {
    const { error } = await supabase.from("egresos").update(v.data).eq("id", id);
    if (error) {
      console.error("[movimientos] Error al actualizar egreso:", error);
      return { ok: false, error: ERROR_GENERICO };
    }

    revalidatePath("/movimientos");
    revalidatePath("/");
    return { ok: true, data: { egresoId: id } };
  });
}

// --------------------------------------------------------------------------
// Reservaciones de un perro para el dropdown del form de ingreso. Incluye las
// FINALIZADAS (solo se excluyen las canceladas) para poder registrar pagos
// tardíos —ej. la mascota se fue y el cliente pagó días después—. Trae el total
// pagado para mostrar el saldo pendiente en el selector.
// --------------------------------------------------------------------------
export async function getReservacionesDelPerro(
  perroId: string,
): Promise<ActionResult<ReservacionAbierta[]>> {
  return withSupabase("movimientos", async (supabase) => {
    const { data, error } = await supabase
      .from("reservaciones")
      .select("id, servicio, fecha_inicio, fecha_fin, estado, precio_acordado, pagos(monto)")
      .eq("perro_id", perroId)
      .neq("estado", "CANCELADA")
      .order("fecha_inicio", { ascending: false });

    if (error) {
      console.error("[movimientos] Error al cargar reservaciones:", error);
      return { ok: false, error: ERROR_GENERICO };
    }
    const reservaciones: ReservacionAbierta[] = (data ?? []).map((r) => ({
      id: r.id,
      servicio: r.servicio,
      fecha_inicio: r.fecha_inicio,
      fecha_fin: r.fecha_fin,
      estado: r.estado,
      precio_acordado: r.precio_acordado,
      pagado: sumarPagos(r.pagos),
    }));
    return { ok: true, data: reservaciones };
  });
}

// --------------------------------------------------------------------------
// Eliminar pago / egreso.
// --------------------------------------------------------------------------
export async function eliminarPago(id: string): Promise<ActionResult<null>> {
  return withSupabase("movimientos", async (supabase) => {
    const { error } = await supabase.from("pagos").delete().eq("id", id);
    if (error) {
      console.error("[movimientos] Error al eliminar pago:", error);
      return { ok: false, error: ERROR_GENERICO };
    }
    revalidatePath("/movimientos");
    revalidatePath("/");
    return { ok: true, data: null };
  });
}

export async function eliminarEgreso(id: string): Promise<ActionResult<null>> {
  return withSupabase("movimientos", async (supabase) => {
    const { error } = await supabase.from("egresos").delete().eq("id", id);
    if (error) {
      console.error("[movimientos] Error al eliminar egreso:", error);
      return { ok: false, error: ERROR_GENERICO };
    }
    revalidatePath("/movimientos");
    revalidatePath("/");
    return { ok: true, data: null };
  });
}
