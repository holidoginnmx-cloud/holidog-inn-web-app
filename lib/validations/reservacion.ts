import { z } from "zod";
import {
  opcional,
  checkbox,
  fechaRequerida,
  fechaOpcional,
  montoNoNegativo,
  montoOpcionalNoNegativo,
} from "./helpers";
import { SERVICIO_OPTIONS, ESTADO_OPTIONS } from "@/lib/labels";

// Validación autoritativa (server-side) de una reservación.
// HOTEL exige rango (fecha_fin); ESTETICA/GUARDERIA son de un día.
export const reservacionInputSchema = z
  .object({
    perro_id: z.uuid("Selecciona un perro"),
    servicio: z.enum(SERVICIO_OPTIONS),
    fecha_inicio: fechaRequerida,
    fecha_fin: fechaOpcional,
    precio_acordado: montoNoNegativo,
    anticipo_acordado: montoOpcionalNoNegativo,
    estado: z.enum(ESTADO_OPTIONS),
    notas: opcional(z.string().max(1000)),
    // Servicios de estética incluidos en la reservación (independientes entre sí).
    incluye_bano: checkbox,
    incluye_corte: checkbox,
    incluye_deslanado: checkbox,
  })
  .refine((d) => d.servicio !== "HOTEL" || d.fecha_fin != null, {
    message: "El hotel requiere una fecha de fin",
    path: ["fecha_fin"],
  })
  .refine((d) => d.fecha_fin == null || d.fecha_fin >= d.fecha_inicio, {
    message: "La fecha de fin no puede ser anterior al inicio",
    path: ["fecha_fin"],
  });

export type ReservacionInput = z.infer<typeof reservacionInputSchema>;
