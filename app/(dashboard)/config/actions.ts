"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, ERROR_GENERICO, validar, withSupabase } from "@/lib/actions";
import {
  configInputSchema,
  renombrarCategoriaSchema,
  tarifasInputSchema,
} from "@/lib/validations/config";

export async function actualizarConfig(input: unknown): Promise<ActionResult<null>> {
  const v = validar(configInputSchema, input);
  if (!v.ok) return v;

  return withSupabase("config", async (supabase) => {
    const { error } = await supabase
      .from("config")
      .update({ nombre_hotel: v.data.nombre_hotel, cupo_maximo: v.data.cupo_maximo })
      .eq("id", 1);
    if (error) {
      console.error("[config] Error al actualizar config:", error);
      return { ok: false, error: ERROR_GENERICO };
    }

    revalidatePath("/config");
    revalidatePath("/reservaciones");
    return { ok: true, data: null };
  });
}

// Renombra una categoría en TODOS los egresos que la usan.
export async function renombrarCategoria(
  input: unknown,
): Promise<ActionResult<{ afectados: number }>> {
  const v = validar(renombrarCategoriaSchema, input);
  if (!v.ok) return v;
  const { anterior, nueva } = v.data;
  if (anterior === nueva) return { ok: true, data: { afectados: 0 } };

  return withSupabase("config", async (supabase) => {
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
  });
}

// Actualiza los precios del catálogo de tarifas (una fila por `codigo`).
export async function actualizarTarifas(input: unknown): Promise<ActionResult<null>> {
  const v = validar(tarifasInputSchema, input);
  if (!v.ok) return v;

  return withSupabase("config", async (supabase) => {
    for (const { codigo, precio } of v.data.tarifas) {
      const { error } = await supabase.from("tarifas").update({ precio }).eq("codigo", codigo);
      if (error) {
        console.error("[config] Error al actualizar tarifa:", codigo, error);
        return { ok: false, error: ERROR_GENERICO };
      }
    }

    revalidatePath("/config");
    revalidatePath("/reservaciones");
    return { ok: true, data: null };
  });
}
