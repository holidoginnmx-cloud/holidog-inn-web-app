"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, ERROR_GENERICO, validar, withSupabase } from "@/lib/actions";
import { pagoInputSchema, pagoUpdateSchema } from "@/lib/validations/pago";
import { egresoInputSchema } from "@/lib/validations/egreso";
import {
  type Servicio,
  type ReservacionEstado,
  servicioToType,
  typeToServicio,
  statusToEstado,
} from "@/lib/labels";
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
  const { perro_id, reservacion_id, servicio, monto, tipo, metodo_pago, fecha, notas } = v.data;

  return withSupabase("movimientos", async (supabase) => {
    let reservacionId = reservacion_id;

    if (reservacion_id === "nueva") {
      // El precio acordado arranca igual al monto; el dueño lo ajusta después.
      // Reservaciones en la tabla unificada `reservations` (requiere ownerId del perro).
      const { data: pet } = await supabase
        .from("pets")
        .select("ownerId")
        .eq("id", perro_id)
        .maybeSingle();
      if (!pet) {
        console.error("[movimientos] perro no encontrado para nueva reservación:", perro_id);
        return { ok: false, error: ERROR_GENERICO };
      }
      const type = servicioToType(servicio as Servicio);
      const fechaTs = new Date(`${fecha}T12:00:00Z`).toISOString();
      const { data: resv, error: resvErr } = await supabase
        .from("reservations")
        .insert({
          id: crypto.randomUUID(),
          petId: perro_id,
          ownerId: pet.ownerId,
          reservationType: type,
          status: "CONFIRMED",
          totalAmount: monto,
          checkIn: type === "STAY" ? fechaTs : null,
          appointmentAt: type === "STAY" ? null : fechaTs,
          updatedAt: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (resvErr || !resv) {
        console.error("[movimientos] Error al crear reservación:", resvErr);
        return { ok: false, error: ERROR_GENERICO };
      }
      reservacionId = resv.id;
    }

    // El admin registra pagos ya recibidos: status PAID. userId = dueño de la
    // reserva (o null si no se encuentra en `reservations`).
    const { data: resvOwner } = await supabase
      .from("reservations")
      .select("ownerId")
      .eq("id", reservacionId)
      .maybeSingle();

    const { data: pago, error: pagoErr } = await supabase
      .from("payments")
      .insert({
        id: crypto.randomUUID(),
        reservationId: reservacionId,
        amount: monto,
        kind: tipo,
        method: metodo_pago,
        status: "PAID",
        userId: resvOwner?.ownerId ?? null,
        paidAt: fecha,
        notes: notas,
      })
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

  const { descripcion, monto, categoria, tipo_costo, fecha, notas } = v.data;

  return withSupabase("movimientos", async (supabase) => {
    const { data: egreso, error } = await supabase
      .from("expenses")
      .insert({
        id: crypto.randomUUID(),
        amount: monto,
        category: categoria,
        costType: tipo_costo,
        description: descripcion,
        date: fecha,
        notes: notas,
      })
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
  const { monto, tipo, metodo_pago, fecha, notas } = v.data;

  return withSupabase("movimientos", async (supabase) => {
    const { error } = await supabase
      .from("payments")
      .update({ amount: monto, kind: tipo, method: metodo_pago, paidAt: fecha, notes: notas })
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
  const { descripcion, monto, categoria, tipo_costo, fecha, notas } = v.data;

  return withSupabase("movimientos", async (supabase) => {
    const { error } = await supabase
      .from("expenses")
      .update({
        amount: monto,
        category: categoria,
        costType: tipo_costo,
        description: descripcion,
        date: fecha,
        notes: notas,
      })
      .eq("id", id);
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
      .from("reservations")
      .select(
        "id, reservationType, checkIn, checkOut, appointmentAt, status, totalAmount, payments(monto:amount)",
      )
      .eq("petId", perroId)
      .neq("status", "CANCELLED")
      .order("checkIn", { ascending: false, nullsFirst: false });

    if (error) {
      console.error("[movimientos] Error al cargar reservaciones:", error);
      return { ok: false, error: ERROR_GENERICO };
    }
    const reservaciones: ReservacionAbierta[] = (data ?? []).map((r) => ({
      id: r.id,
      servicio: typeToServicio(r.reservationType),
      fecha_inicio: (r.checkIn ?? r.appointmentAt ?? "").slice(0, 10),
      fecha_fin: r.checkOut ? r.checkOut.slice(0, 10) : null,
      estado: statusToEstado(r.status),
      precio_acordado: r.totalAmount,
      pagado: sumarPagos(r.payments),
    }));
    return { ok: true, data: reservaciones };
  });
}

// --------------------------------------------------------------------------
// Eliminar pago / egreso.
// --------------------------------------------------------------------------
export async function eliminarPago(id: string): Promise<ActionResult<null>> {
  return withSupabase("movimientos", async (supabase) => {
    const { error } = await supabase.from("payments").delete().eq("id", id);
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
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      console.error("[movimientos] Error al eliminar egreso:", error);
      return { ok: false, error: ERROR_GENERICO };
    }
    revalidatePath("/movimientos");
    revalidatePath("/");
    return { ok: true, data: null };
  });
}
