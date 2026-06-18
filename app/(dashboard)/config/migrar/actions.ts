"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, withSupabase } from "@/lib/actions";
import { construirMigracion, type MigracionData, type ResumenMigracion } from "@/lib/migracion";
import type { Json } from "@/lib/supabase/types";

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
  const migracion = data;

  return withSupabase("migrar", async (supabase) => {
    // El RPC recibe un único parámetro `Json`. El payload es estructuralmente
    // JSON (arrays de objetos planos), pero sus tipos concretos no se solapan
    // con el tipo recursivo `Json`, así que el cast doble es la vía idiomática.
    const payload = {
      clientes: migracion.clientes,
      perros: migracion.perros,
      reservaciones: migracion.reservaciones,
      pagos: migracion.pagos,
      egresos: migracion.egresos,
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
    return { ok: true, data: migracion.resumen };
  });
}
