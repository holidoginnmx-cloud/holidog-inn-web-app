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

// Edición de precios de hospedaje (singleton `lodging_pricing`). Cada campo es
// un monto >= 0; `largeWeightKg` y `medicationSurchargePct` también lo son.
export const lodgingPricingSchema = z.object({
  pricePerDaySmall: montoNoNegativo,
  pricePerDayLarge: montoNoNegativo,
  priceProbarfSmall: montoNoNegativo,
  priceProbarfLarge: montoNoNegativo,
  daycarePricePerDay: montoNoNegativo,
  largeWeightKg: montoNoNegativo,
  medicationSurchargePct: montoNoNegativo,
});

export type LodgingPricingInput = z.infer<typeof lodgingPricingSchema>;

// Edición de precios de estética: una fila por variante (`id`) de
// `service_variants`. Solo editamos el precio.
export const serviceVariantsSchema = z.object({
  variantes: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        price: montoNoNegativo,
      }),
    )
    .min(1, "No hay variantes que guardar"),
});

export type ServiceVariantsInput = z.infer<typeof serviceVariantsSchema>;
