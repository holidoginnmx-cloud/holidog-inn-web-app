import { z } from "zod";
import { opcional, checkbox, fechaOpcional } from "./helpers";
import { clienteInputSchema } from "./cliente";

export type { ClienteInput } from "./cliente";

export const SEXO_VALUES = ["MACHO", "HEMBRA"] as const;
// Tallas del esquema unificado (PetSize). El form sigue en español en sus
// etiquetas, pero los valores son los del enum nuevo.
export const TALLA_VALUES = ["XS", "S", "M", "L", "XL"] as const;

// Peso: "" → null; número válido entre 0 y 120 kg. Si hay peso, la BD recalcula
// la talla (el peso manda); si no hay peso, se respeta la talla seleccionada.
const pesoOpcional = z.preprocess((v) => {
  if (v === undefined || v === null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).trim());
  return Number.isNaN(n) ? Number.NaN : n;
}, z.number().positive("El peso debe ser mayor a 0").max(120, "El peso parece fuera de rango").nullable());

// Esterilizado tri-estado: "" / null → null; true/"SI"/"true" → true; "NO"/"false" → false.
const esterilizadoOpcional = z.preprocess((v) => {
  if (v === undefined || v === null || v === "") return null;
  if (v === true || v === "true" || v === "SI" || v === "SÍ" || v === "1") return true;
  if (v === false || v === "false" || v === "NO" || v === "0") return false;
  return null;
}, z.boolean().nullable());

// Validación autoritativa (server-side) de los datos de un perro.
export const perroInputSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre del perro es obligatorio").max(80),
  raza: opcional(z.string().max(80)),
  sexo: opcional(z.enum(SEXO_VALUES)),
  talla: opcional(z.enum(TALLA_VALUES)),
  fecha_nacimiento: fechaOpcional,
  peso_kg: pesoOpcional,
  alergias: opcional(z.string().max(1000)),
  comportamiento: opcional(z.string().max(1000)),
  veterinario: opcional(z.string().max(120)),
  esterilizado: esterilizadoOpcional,
  notas: opcional(z.string().max(1000)),
  domicilio: opcional(z.string().max(300)),
  cartilla_vigente: checkbox,
  cartilla_vence: fechaOpcional,
  desparasitacion_vigente: checkbox,
  desparasitacion_vence: fechaOpcional,
});

export type PerroInput = z.infer<typeof perroInputSchema>;

// Alta combinada: un cliente + su perro en una sola operación.
export const nuevoPerroSchema = z.object({
  cliente: clienteInputSchema,
  perro: perroInputSchema,
});

export type NuevoPerroInput = z.infer<typeof nuevoPerroSchema>;
