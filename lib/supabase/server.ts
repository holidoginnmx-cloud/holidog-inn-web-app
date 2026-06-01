import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Cliente de servidor con SERVICE_ROLE_KEY. El `import "server-only"` garantiza
// que este módulo NUNCA llegue al bundle del cliente: si alguien lo importa
// desde un client component, el build falla (ver CLAUDE.md §7, §9).
//
// La service role key salta las RLS policies, por eso vive solo en el servidor.

export function createSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.");
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
