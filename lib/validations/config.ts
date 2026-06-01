import { z } from "zod";

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
