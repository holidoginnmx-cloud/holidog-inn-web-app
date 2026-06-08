import type { Enums } from "@/lib/supabase/types";
import type { PetSize } from "@/lib/labels";

// ⚠️ Tipos LEGACY (tablas en español). Aún los consumen módulos NO migrados
// todavía: lib/tarifas.ts, lib/migracion.ts y el área de reservaciones. NO los
// elimines hasta que esos módulos migren a `pets`/PetSize. Los archivos de
// perros (migrados) usan los nuevos tipos/ayudantes de abajo (PetSize, "M"/"F").
export type Talla = Enums<"talla_perro">;
export type Sexo = Enums<"sexo_perro">;

// ---- Esquema unificado (pets / PetSize / sex "M" | "F") --------------------
export type { PetSize } from "@/lib/labels";

// Sexo en la BD nueva: "M" | "F". El UI sigue mostrando "Macho"/"Hembra".
export type PetSex = "M" | "F";
// "M" → "MACHO" / "F" → "HEMBRA" (valor legacy que espera el FORM y SEXO_LABEL).
export function sexToSexo(sex: string | null | undefined): Sexo | null {
  if (sex === "M") return "MACHO";
  if (sex === "F") return "HEMBRA";
  return null;
}
// "MACHO" → "M" / "HEMBRA" → "F" (form → BD). "" / null → null.
export function sexoToSex(sexo: string | null | undefined): PetSex | null {
  if (sexo === "MACHO") return "M";
  if (sexo === "HEMBRA") return "F";
  return null;
}

// Bandas de talla del esquema unificado: <5→XS, <10→S, <20→M, <=35→L, >35→XL.
// Si no hay peso, default "M" (decisión documentada de la migración).
export function calcularSize(pesoKg: number | null | undefined): PetSize {
  if (pesoKg == null || Number.isNaN(pesoKg) || pesoKg <= 0) return "M";
  if (pesoKg < 5) return "XS";
  if (pesoKg < 10) return "S";
  if (pesoKg < 20) return "M";
  if (pesoKg <= 35) return "L";
  return "XL";
}

// Rangos (kg) por PetSize, para la previsualización en el formulario.
export const SIZE_RANGO: Record<PetSize, string> = {
  XS: "<5 kg",
  S: "5–9 kg",
  M: "10–19 kg",
  L: "20–35 kg",
  XL: "35+ kg",
};

// Orden y clases de color por PetSize (escaneo visual en la lista).
export const SIZE_ORDEN: PetSize[] = ["XS", "S", "M", "L", "XL"];
export const SIZE_CLASS: Record<PetSize, string> = {
  XS: "bg-emerald-100 text-emerald-800",
  S: "bg-sky-100 text-sky-800",
  M: "bg-amber-100 text-amber-900",
  L: "bg-orange-100 text-orange-900",
  XL: "bg-rose-100 text-rose-900",
};

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
