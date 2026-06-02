import "server-only";
import type { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

// Resultado uniforme de toda Server Action (ver CLAUDE.md §6). Los formularios
// hacen narrowing sobre `ok` para manejar éxito/error de forma consistente.
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

// Cliente de Supabase tipado, para los callbacks de withSupabase().
export type DB = SupabaseClient<Database>;

// Mensajes genéricos compartidos (los detalles reales se loguean, no se exponen).
export const ERROR_GENERICO = "No se pudo guardar. Intenta de nuevo.";
export const ERROR_DB = "La base de datos no está configurada.";

// Inicializa el cliente de servidor y ejecuta `fn` con él. Si el entorno no
// tiene las variables de Supabase, devuelve el error genérico sin reventar.
export async function withSupabase<T>(
  contexto: string,
  fn: (sb: DB) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  let sb: DB;
  try {
    sb = createSupabaseServerClient();
  } catch (e) {
    console.error(`[${contexto}] Supabase no configurado:`, e);
    return { ok: false, error: ERROR_DB };
  }
  return fn(sb);
}

// Valida `input` contra un schema de zod. En éxito devuelve los datos parseados;
// en error, el primer mensaje del schema (o un genérico). El resultado es un
// ActionResult, así que `if (!v.ok) return v;` propaga el error directo.
export function validar<T>(schema: z.ZodType<T>, input: unknown): ActionResult<T> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  return { ok: true, data: parsed.data };
}
