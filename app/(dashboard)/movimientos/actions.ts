"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { pagoInputSchema, pagoUpdateSchema } from "@/lib/validations/pago";
import { egresoInputSchema } from "@/lib/validations/egreso";
import type { Servicio, ReservacionEstado } from "@/lib/labels";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const ERROR_GENERICO = "No se pudo guardar. Intenta de nuevo.";

export type ReservacionAbierta = {
  id: string;
  servicio: Servicio;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: ReservacionEstado;
  precio_acordado: number;
};

// --------------------------------------------------------------------------
// Ingreso (Pago). Si reservacion_id === "nueva", crea la reservación primero.
// --------------------------------------------------------------------------
export async function crearPago(input: unknown): Promise<ActionResult<{ pagoId: string }>> {
  const parsed = pagoInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { perro_id, reservacion_id, servicio, monto, tipo, fecha, notas } = parsed.data;

  let supabase;
  try {
    supabase = createSupabaseServerClient();
  } catch (e) {
    console.error("[movimientos] Supabase no configurado:", e);
    return { ok: false, error: "La base de datos no está configurada." };
  }

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
}

// --------------------------------------------------------------------------
// Egreso.
// --------------------------------------------------------------------------
export async function crearEgreso(input: unknown): Promise<ActionResult<{ egresoId: string }>> {
  const parsed = egresoInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  let supabase;
  try {
    supabase = createSupabaseServerClient();
  } catch (e) {
    console.error("[movimientos] Supabase no configurado:", e);
    return { ok: false, error: "La base de datos no está configurada." };
  }

  const { data: egreso, error } = await supabase
    .from("egresos")
    .insert(parsed.data)
    .select("id")
    .single();
  if (error || !egreso) {
    console.error("[movimientos] Error al crear egreso:", error);
    return { ok: false, error: ERROR_GENERICO };
  }

  revalidatePath("/movimientos");
  return { ok: true, data: { egresoId: egreso.id } };
}

// --------------------------------------------------------------------------
// Editar pago / egreso existentes (desde la lista de movimientos).
// --------------------------------------------------------------------------
export async function actualizarPago(
  id: string,
  input: unknown,
): Promise<ActionResult<{ pagoId: string }>> {
  const parsed = pagoUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { monto, tipo, fecha, notas } = parsed.data;

  let supabase;
  try {
    supabase = createSupabaseServerClient();
  } catch (e) {
    console.error("[movimientos] Supabase no configurado:", e);
    return { ok: false, error: "La base de datos no está configurada." };
  }

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
}

export async function actualizarEgreso(
  id: string,
  input: unknown,
): Promise<ActionResult<{ egresoId: string }>> {
  const parsed = egresoInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  let supabase;
  try {
    supabase = createSupabaseServerClient();
  } catch (e) {
    console.error("[movimientos] Supabase no configurado:", e);
    return { ok: false, error: "La base de datos no está configurada." };
  }

  const { error } = await supabase.from("egresos").update(parsed.data).eq("id", id);
  if (error) {
    console.error("[movimientos] Error al actualizar egreso:", error);
    return { ok: false, error: ERROR_GENERICO };
  }

  revalidatePath("/movimientos");
  revalidatePath("/");
  return { ok: true, data: { egresoId: id } };
}

// --------------------------------------------------------------------------
// Reservaciones abiertas de un perro (para el dropdown del form de ingreso).
// --------------------------------------------------------------------------
export async function getReservacionesAbiertas(
  perroId: string,
): Promise<ActionResult<ReservacionAbierta[]>> {
  let supabase;
  try {
    supabase = createSupabaseServerClient();
  } catch (e) {
    console.error("[movimientos] Supabase no configurado:", e);
    return { ok: false, error: "La base de datos no está configurada." };
  }

  const { data, error } = await supabase
    .from("reservaciones")
    .select("id, servicio, fecha_inicio, fecha_fin, estado, precio_acordado")
    .eq("perro_id", perroId)
    .in("estado", ["RESERVADA", "EN_CURSO"])
    .order("fecha_inicio", { ascending: false });

  if (error) {
    console.error("[movimientos] Error al cargar reservaciones:", error);
    return { ok: false, error: ERROR_GENERICO };
  }
  return { ok: true, data: data ?? [] };
}

// --------------------------------------------------------------------------
// Eliminar pago / egreso.
// --------------------------------------------------------------------------
export async function eliminarPago(id: string): Promise<ActionResult<null>> {
  let supabase;
  try {
    supabase = createSupabaseServerClient();
  } catch (e) {
    console.error("[movimientos] Supabase no configurado:", e);
    return { ok: false, error: "La base de datos no está configurada." };
  }
  const { error } = await supabase.from("pagos").delete().eq("id", id);
  if (error) {
    console.error("[movimientos] Error al eliminar pago:", error);
    return { ok: false, error: ERROR_GENERICO };
  }
  revalidatePath("/movimientos");
  revalidatePath("/");
  return { ok: true, data: null };
}

export async function eliminarEgreso(id: string): Promise<ActionResult<null>> {
  let supabase;
  try {
    supabase = createSupabaseServerClient();
  } catch (e) {
    console.error("[movimientos] Supabase no configurado:", e);
    return { ok: false, error: "La base de datos no está configurada." };
  }
  const { error } = await supabase.from("egresos").delete().eq("id", id);
  if (error) {
    console.error("[movimientos] Error al eliminar egreso:", error);
    return { ok: false, error: ERROR_GENERICO };
  }
  revalidatePath("/movimientos");
  revalidatePath("/");
  return { ok: true, data: null };
}
