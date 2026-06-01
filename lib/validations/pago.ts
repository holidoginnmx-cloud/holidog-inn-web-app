import { z } from "zod";
import { opcional, montoRequerido, fechaRequerida } from "./helpers";
import { SERVICIO_OPTIONS, PAGO_TIPO_OPTIONS } from "@/lib/labels";

// Validación autoritativa (server-side) de un pago (ingreso).
// `reservacion_id` es "nueva" (crear reservación con este pago) o un UUID.
export const pagoInputSchema = z
  .object({
    perro_id: z.uuid("Selecciona un perro"),
    reservacion_id: z.string().min(1, "Selecciona una reservación"),
    servicio: opcional(z.enum(SERVICIO_OPTIONS)),
    monto: montoRequerido,
    tipo: z.enum(PAGO_TIPO_OPTIONS),
    fecha: fechaRequerida,
    notas: opcional(z.string().max(1000)),
  })
  .refine((d) => d.reservacion_id !== "nueva" || d.servicio != null, {
    message: "Elige el servicio para la nueva reservación",
    path: ["servicio"],
  });

export type PagoInput = z.infer<typeof pagoInputSchema>;

// Edición de un pago existente: solo los campos del propio pago (el perro y la
// reservación no se cambian aquí).
export const pagoUpdateSchema = z.object({
  monto: montoRequerido,
  tipo: z.enum(PAGO_TIPO_OPTIONS),
  fecha: fechaRequerida,
  notas: opcional(z.string().max(1000)),
});

export type PagoUpdate = z.infer<typeof pagoUpdateSchema>;
