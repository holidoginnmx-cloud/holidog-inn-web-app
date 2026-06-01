"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { patrocinioInputSchema } from "@/lib/validations/patrocinio";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const ERROR_GENERICO = "No se pudo guardar. Intenta de nuevo.";
const RUTA = "/config/patrocinios";

export async function crearPatrocinio(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = patrocinioInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  let supabase;
  try {
    supabase = createSupabaseServerClient();
  } catch {
    return { ok: false, error: "La base de datos no está configurada." };
  }

  const { data, error } = await supabase
    .from("patrocinios")
    .insert(parsed.data)
    .select("id")
    .single();
  if (error || !data) {
    console.error("[patrocinios] crear:", error);
    return { ok: false, error: ERROR_GENERICO };
  }

  revalidatePath(RUTA);
  return { ok: true, data: { id: data.id } };
}

export async function actualizarPatrocinio(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = patrocinioInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  let supabase;
  try {
    supabase = createSupabaseServerClient();
  } catch {
    return { ok: false, error: "La base de datos no está configurada." };
  }

  const { error } = await supabase.from("patrocinios").update(parsed.data).eq("id", id);
  if (error) {
    console.error("[patrocinios] actualizar:", error);
    return { ok: false, error: ERROR_GENERICO };
  }

  revalidatePath(RUTA);
  return { ok: true, data: { id } };
}

export async function eliminarPatrocinio(id: string): Promise<ActionResult<null>> {
  let supabase;
  try {
    supabase = createSupabaseServerClient();
  } catch {
    return { ok: false, error: "La base de datos no está configurada." };
  }

  const { error } = await supabase.from("patrocinios").delete().eq("id", id);
  if (error) {
    console.error("[patrocinios] eliminar:", error);
    return { ok: false, error: ERROR_GENERICO };
  }

  revalidatePath(RUTA);
  return { ok: true, data: null };
}
