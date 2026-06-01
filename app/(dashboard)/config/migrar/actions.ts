"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { construirMigracion, type MigracionData, type ResumenMigracion } from "@/lib/migracion";
import type { Json } from "@/lib/supabase/types";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function parsearArchivo(formData: FormData): Promise<MigracionData | null> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return null;
  const buffer = await file.arrayBuffer();
  return construirMigracion(buffer);
}

// Paso 1: parsear y devolver el resumen para la pantalla de confirmación.
export async function previewMigracion(
  formData: FormData,
): Promise<ActionResult<ResumenMigracion>> {
  try {
    const data = await parsearArchivo(formData);
    if (!data) return { ok: false, error: "Sube un archivo .xlsx válido." };
    return { ok: true, data: data.resumen };
  } catch (e) {
    console.error("[migrar] Error al leer el Excel:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo leer el archivo.",
    };
  }
}

// Paso 2 (tras confirmar): re-parsea y aplica vía RPC transaccional.
export async function aplicarMigracion(
  formData: FormData,
): Promise<ActionResult<ResumenMigracion>> {
  let data: MigracionData | null;
  try {
    data = await parsearArchivo(formData);
  } catch (e) {
    console.error("[migrar] Error al leer el Excel:", e);
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo leer el archivo." };
  }
  if (!data) return { ok: false, error: "Sube un archivo .xlsx válido." };

  let supabase;
  try {
    supabase = createSupabaseServerClient();
  } catch (e) {
    console.error("[migrar] Supabase no configurado:", e);
    return { ok: false, error: "La base de datos no está configurada." };
  }

  const payload = {
    clientes: data.clientes,
    perros: data.perros,
    reservaciones: data.reservaciones,
    pagos: data.pagos,
    egresos: data.egresos,
  } as unknown as Json;

  const { error } = await supabase.rpc("aplicar_migracion_legacy", { payload });
  if (error) {
    console.error("[migrar] Error en RPC aplicar_migracion_legacy:", error);
    return {
      ok: false,
      error:
        "No se pudo aplicar la migración. Verifica que corriste las migraciones 0002, 0004 y 0005 en Supabase.",
    };
  }

  revalidatePath("/");
  revalidatePath("/perros");
  revalidatePath("/movimientos");
  revalidatePath("/reservaciones");
  return { ok: true, data: data.resumen };
}
