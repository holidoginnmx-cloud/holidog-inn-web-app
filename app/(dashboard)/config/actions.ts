"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  configInputSchema,
  renombrarCategoriaSchema,
  tarifasInputSchema,
} from "@/lib/validations/config";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const ERROR_GENERICO = "No se pudo guardar. Intenta de nuevo.";

export async function actualizarConfig(input: unknown): Promise<ActionResult<null>> {
  const parsed = configInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  let supabase;
  try {
    supabase = createSupabaseServerClient();
  } catch (e) {
    console.error("[config] Supabase no configurado:", e);
    return { ok: false, error: "La base de datos no está configurada." };
  }

  const { error } = await supabase
    .from("config")
    .update({ nombre_hotel: parsed.data.nombre_hotel, cupo_maximo: parsed.data.cupo_maximo })
    .eq("id", 1);
  if (error) {
    console.error("[config] Error al actualizar config:", error);
    return { ok: false, error: ERROR_GENERICO };
  }

  revalidatePath("/config");
  revalidatePath("/reservaciones");
  return { ok: true, data: null };
}

// Renombra una categoría en TODOS los egresos que la usan.
export async function renombrarCategoria(
  input: unknown,
): Promise<ActionResult<{ afectados: number }>> {
  const parsed = renombrarCategoriaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { anterior, nueva } = parsed.data;
  if (anterior === nueva) return { ok: true, data: { afectados: 0 } };

  let supabase;
  try {
    supabase = createSupabaseServerClient();
  } catch (e) {
    console.error("[config] Supabase no configurado:", e);
    return { ok: false, error: "La base de datos no está configurada." };
  }

  const { data, error } = await supabase
    .from("egresos")
    .update({ categoria: nueva })
    .eq("categoria", anterior)
    .select("id");
  if (error) {
    console.error("[config] Error al renombrar categoría:", error);
    return { ok: false, error: ERROR_GENERICO };
  }

  revalidatePath("/config");
  revalidatePath("/");
  return { ok: true, data: { afectados: data?.length ?? 0 } };
}

// Actualiza los precios del catálogo de tarifas (una fila por `codigo`).
export async function actualizarTarifas(input: unknown): Promise<ActionResult<null>> {
  const parsed = tarifasInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  let supabase;
  try {
    supabase = createSupabaseServerClient();
  } catch (e) {
    console.error("[config] Supabase no configurado:", e);
    return { ok: false, error: "La base de datos no está configurada." };
  }

  for (const { codigo, precio } of parsed.data.tarifas) {
    const { error } = await supabase.from("tarifas").update({ precio }).eq("codigo", codigo);
    if (error) {
      console.error("[config] Error al actualizar tarifa:", codigo, error);
      return { ok: false, error: ERROR_GENERICO };
    }
  }

  revalidatePath("/config");
  revalidatePath("/reservaciones");
  return { ok: true, data: null };
}
