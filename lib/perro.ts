import type { Enums } from "@/lib/supabase/types";

export type Talla = Enums<"talla_perro">;
export type Sexo = Enums<"sexo_perro">;

// Marcadores de registros "fantasma" creados al migrar pagos que no se pudieron
// enlazar a un perro/cliente real. Se usan para ocultarlos de las listas y para
// la pantalla de revisión (/perros/revisar). Deben coincidir con lo que escribe
// el parser (lib/migracion.ts) y las migraciones SQL.
export const MARCA_REVISAR_PERRO = "REVISAR: enlazar a perro real";
export const MARCA_REVISAR_CLIENTE = "REVISAR: enlazar a cliente real";

// Mismo cálculo que la columna generada `perros.talla` en schema.sql. Se usa solo
// para previsualizar la talla en el formulario; la fuente de verdad es la BD.
export function calcularTalla(pesoKg: number | null | undefined): Talla | null {
  if (pesoKg == null || Number.isNaN(pesoKg) || pesoKg <= 0) return null;
  if (pesoKg < 6) return "EXTRA_CHICO";
  if (pesoKg < 16) return "CHICO";
  if (pesoKg <= 25) return "MEDIANO";
  return "GRANDE";
}

export const TALLA_LABEL: Record<Talla, string> = {
  EXTRA_CHICO: "Extra chico",
  CHICO: "Chico",
  MEDIANO: "Mediano",
  GRANDE: "Grande",
};

export const TALLA_RANGO: Record<Talla, string> = {
  EXTRA_CHICO: "1–5 kg",
  CHICO: "6–15 kg",
  MEDIANO: "16–25 kg",
  GRANDE: "25+ kg",
};

// Clases de color por talla, para escaneo visual rápido en la lista.
export const TALLA_CLASS: Record<Talla, string> = {
  EXTRA_CHICO: "bg-emerald-100 text-emerald-800",
  CHICO: "bg-sky-100 text-sky-800",
  MEDIANO: "bg-amber-100 text-amber-900",
  GRANDE: "bg-rose-100 text-rose-900",
};

export const SEXO_LABEL: Record<Sexo, string> = {
  MACHO: "Macho",
  HEMBRA: "Hembra",
};

// Inicial para el avatar cuando el perro no tiene foto.
export function inicial(nombre: string): string {
  return nombre.trim().charAt(0).toUpperCase() || "🐶";
}
