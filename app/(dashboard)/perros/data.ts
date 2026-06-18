import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { VaccineCatalogItem } from "@/lib/validations/salud";

// Catálogo de vacunas activas (fuente de los nombres de vacuna, compartido con
// la app móvil). Lo consumen las pantallas de alta y edición de perro para
// poblar el selector del editor de vacunas.
export async function obtenerCatalogoVacunas(): Promise<VaccineCatalogItem[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("vaccine_catalog")
    .select("id, displayName, defaultDurationDays")
    .eq("isActive", true)
    .order("displayName");
  if (error) {
    console.error("[perros] Error al cargar el catálogo de vacunas:", error);
    return [];
  }
  return data ?? [];
}
