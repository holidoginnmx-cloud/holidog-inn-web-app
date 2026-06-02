"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, ERROR_GENERICO, validar, withSupabase } from "@/lib/actions";
import { patrocinioInputSchema } from "@/lib/validations/patrocinio";

const RUTA = "/config/patrocinios";

export async function crearPatrocinio(input: unknown): Promise<ActionResult<{ id: string }>> {
  const v = validar(patrocinioInputSchema, input);
  if (!v.ok) return v;

  return withSupabase("patrocinios", async (supabase) => {
    const { data, error } = await supabase
      .from("patrocinios")
      .insert(v.data)
      .select("id")
      .single();
    if (error || !data) {
      console.error("[patrocinios] crear:", error);
      return { ok: false, error: ERROR_GENERICO };
    }

    revalidatePath(RUTA);
    return { ok: true, data: { id: data.id } };
  });
}

export async function actualizarPatrocinio(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const v = validar(patrocinioInputSchema, input);
  if (!v.ok) return v;

  return withSupabase("patrocinios", async (supabase) => {
    const { error } = await supabase.from("patrocinios").update(v.data).eq("id", id);
    if (error) {
      console.error("[patrocinios] actualizar:", error);
      return { ok: false, error: ERROR_GENERICO };
    }

    revalidatePath(RUTA);
    return { ok: true, data: { id } };
  });
}

export async function eliminarPatrocinio(id: string): Promise<ActionResult<null>> {
  return withSupabase("patrocinios", async (supabase) => {
    const { error } = await supabase.from("patrocinios").delete().eq("id", id);
    if (error) {
      console.error("[patrocinios] eliminar:", error);
      return { ok: false, error: ERROR_GENERICO };
    }

    revalidatePath(RUTA);
    return { ok: true, data: null };
  });
}
