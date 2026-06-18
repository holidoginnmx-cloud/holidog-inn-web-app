import { z } from "zod";
import { opcional, fechaRequerida, fechaOpcional } from "./helpers";

// Validación de los registros de salud de un perro (desparasitaciones y, más
// adelante, vacunas). Estas entidades viven en tablas propias del esquema
// unificado (`dewormings`, `vaccines`) compartido con la app móvil, no en `pets`.
// El formulario las envía como JSON; la Server Action hace JSON.parse y valida
// con estos schemas antes de sincronizar.

// ---- Desparasitación (tabla `dewormings`) ----------------------------------
export const DEWORMING_TYPE_OPTIONS = ["INTERNAL", "EXTERNAL", "BOTH"] as const;
export type DewormingType = (typeof DEWORMING_TYPE_OPTIONS)[number];

// Etiquetas en español (mismas que la app móvil).
export const DEWORMING_TYPE_LABEL: Record<DewormingType, string> = {
  INTERNAL: "Interna",
  EXTERNAL: "Externa",
  BOTH: "Ambas",
};

// Días por defecto hasta la próxima dosis (mismo valor que la app móvil).
export const DEWORMING_DEFAULT_DAYS = 90;

export const dewormingSchema = z.object({
  // Presente solo al editar un registro existente; ausente/"" en los nuevos.
  id: opcional(z.string()),
  type: z.enum(DEWORMING_TYPE_OPTIONS),
  productName: opcional(z.string().max(120)),
  appliedAt: fechaRequerida,
  expiresAt: fechaOpcional,
  vetName: opcional(z.string().max(120)),
  notes: opcional(z.string().max(500)),
});

export type DewormingInput = z.infer<typeof dewormingSchema>;

// Lista completa de desparasitaciones del perro (estado deseado tras guardar).
export const dewormingsPayloadSchema = z.array(dewormingSchema).max(50);

// Parsea el JSON del FormData a un array validado. Entrada inválida → [].
export function parseDewormings(raw: FormDataEntryValue | null): DewormingInput[] {
  if (typeof raw !== "string" || raw.trim() === "") return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  const parsed = dewormingsPayloadSchema.safeParse(data);
  return parsed.success ? parsed.data : [];
}

// ---- Vacunas / cartilla (tablas `vaccines` + `vaccine_catalog`) ------------
// Una entrada del catálogo (lo que el admin elige en el formulario). El `name`
// de la vacuna SIEMPRE se deriva del catálogo en el servidor (no del cliente),
// igual que en la app móvil.
export type VaccineCatalogItem = {
  id: string;
  displayName: string;
  defaultDurationDays: number;
};

export const vaccineSchema = z.object({
  id: opcional(z.string()),
  catalogId: z.string().trim().min(1, "Selecciona la vacuna"),
  appliedAt: fechaRequerida,
  expiresAt: fechaOpcional,
  vetName: opcional(z.string().max(120)),
});

export type VaccineInput = z.infer<typeof vaccineSchema>;

export const vaccinesPayloadSchema = z.array(vaccineSchema).max(50);

export function parseVaccines(raw: FormDataEntryValue | null): VaccineInput[] {
  if (typeof raw !== "string" || raw.trim() === "") return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  const parsed = vaccinesPayloadSchema.safeParse(data);
  return parsed.success ? parsed.data : [];
}
