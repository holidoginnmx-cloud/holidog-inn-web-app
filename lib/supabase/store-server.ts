import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { StoreDatabase } from "./store-types";

// Cliente de servidor (SERVICE_ROLE_KEY) tipado para las tablas de tienda.
// Igual que `createSupabaseServerClient`, pero con el tipo `StoreDatabase` para
// las tablas de e-commerce (gestionadas por Prisma). Server-only.

export type StoreDB = SupabaseClient<StoreDatabase>;

export function createStoreServerClient(): StoreDB {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.");
  }

  return createClient<StoreDatabase>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
