import { z } from "zod";
import { opcional, montoRequerido, fechaRequerida } from "./helpers";
import { TIPO_COSTO_OPTIONS } from "@/lib/labels";

// Validación autoritativa (server-side) de un egreso.
export const egresoInputSchema = z.object({
  descripcion: z.string().trim().min(1, "La descripción es obligatoria").max(200),
  monto: montoRequerido,
  categoria: z.string().trim().min(1, "La categoría es obligatoria").max(80),
  tipo_costo: z.enum(TIPO_COSTO_OPTIONS),
  fecha: fechaRequerida,
  notas: opcional(z.string().max(1000)),
});

export type EgresoInput = z.infer<typeof egresoInputSchema>;
