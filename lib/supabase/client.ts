import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Cliente de navegador (anon key). Úsalo SOLO desde client components cuando de
// verdad haga falta consultar en el cliente; por default preferimos Server
// Components / Server Actions (ver CLAUDE.md §2, §6).
//
// La anon key es segura para exponer al navegador; la protección real vive en
// las RLS policies de Supabase.

export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno.",
    );
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}
