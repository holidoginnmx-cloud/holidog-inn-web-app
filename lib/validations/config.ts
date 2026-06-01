import { z } from "zod";
import { montoNoNegativo } from "./helpers";

export const configInputSchema = z.object({
  nombre_hotel: z.string().trim().min(1, "El nombre es obligatorio").max(80),
  cupo_maximo: z.coerce
    .number()
    .int("Debe ser un número entero")
    .min(1, "El cupo debe ser al menos 1")
    .max(500, "Cupo fuera de rango"),
});

export type ConfigInput = z.infer<typeof configInputSchema>;

export const renombrarCategoriaSchema = z.object({
  anterior: z.string().trim().min(1),
  nueva: z.string().trim().min(1, "El nombre no puede estar vacío").max(80),
});

// Edición de precios del catálogo de tarifas (cada fila por su `codigo`).
export const tarifasInputSchema = z.object({
  tarifas: z
    .array(
      z.object({
        codigo: z.string().trim().min(1),
        precio: montoNoNegativo,
      }),
    )
    .min(1, "No hay tarifas que guardar"),
});

export type TarifasInput = z.infer<typeof tarifasInputSchema>;
