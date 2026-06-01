import { z } from "zod";
import { checkbox } from "./helpers";

// Patrocinador (hoja "PATROCINIOS" del Excel): nombre + dos banderas.
export const patrocinioInputSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  patrocina_bano: checkbox,
  patrocina_corral: checkbox,
});

export type PatrocinioInput = z.infer<typeof patrocinioInputSchema>;
