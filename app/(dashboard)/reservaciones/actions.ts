"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { reservacionInputSchema } from "@/lib/validations/reservacion";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const ERROR_GENERICO = "No se pudo guardar. Intenta de nuevo.";

// Construye el row para insert/update. ESTETICA/GUARDERIA son de un día → fin null.
function aRow(data: ReturnType<typeof reservacionInputSchema.parse>) {
  return {
    perro_id: data.perro_id,
    servicio: data.servicio,
    fecha_inicio: data.fecha_inicio,
    fecha_fin: data.servicio === "HOTEL" ? data.fecha_fin : null,
    precio_acordado: data.precio_acordado,
    anticipo_acordado: data.anticipo_acordado,
    estado: data.estado,
    notas: data.notas,
  };
}

export async function crearReservacion(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = reservacionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  let supabase;
  try {
    supabase = createSupabaseServerClient();
  } catch (e) {
    console.error("[reservaciones] Supabase no configurado:", e);
    return { ok: false, error: "La base de datos no está configurada." };
  }

  const { data: row, error } = await supabase
    .from("reservaciones")
    .insert(aRow(parsed.data))
    .select("id")
    .single();
  if (error || !row) {
    console.error("[reservaciones] Error al crear:", error);
    return { ok: false, error: ERROR_GENERICO };
  }

  revalidatePath("/reservaciones");
  revalidatePath(`/perros/${parsed.data.perro_id}`);
  return { ok: true, data: { id: row.id } };
}

export async function actualizarReservacion(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = reservacionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  let supabase;
  try {
    supabase = createSupabaseServerClient();
  } catch (e) {
    console.error("[reservaciones] Supabase no configurado:", e);
    return { ok: false, error: "La base de datos no está configurada." };
  }

  const { error } = await supabase.from("reservaciones").update(aRow(parsed.data)).eq("id", id);
  if (error) {
    console.error("[reservaciones] Error al actualizar:", error);
    return { ok: false, error: ERROR_GENERICO };
  }

  revalidatePath("/reservaciones");
  revalidatePath(`/perros/${parsed.data.perro_id}`);
  return { ok: true, data: { id } };
}

// Elimina una reservación (cascada borra sus pagos por FK).
export async function eliminarReservacion(id: string): Promise<ActionResult<null>> {
  let supabase;
  try {
    supabase = createSupabaseServerClient();
  } catch (e) {
    console.error("[reservaciones] Supabase no configurado:", e);
    return { ok: false, error: "La base de datos no está configurada." };
  }
  const { error } = await supabase.from("reservaciones").delete().eq("id", id);
  if (error) {
    console.error("[reservaciones] Error al eliminar:", error);
    return { ok: false, error: ERROR_GENERICO };
  }
  revalidatePath("/reservaciones");
  revalidatePath("/");
  return { ok: true, data: null };
}
