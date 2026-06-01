import { z } from "zod";
import { opcional } from "./helpers";

// Validación autoritativa (server-side) de los datos de un cliente.
export const clienteInputSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre del cliente es obligatorio").max(120),
  telefono: opcional(z.string().max(40)),
  email: opcional(z.email("Correo electrónico inválido")),
  notas: opcional(z.string().max(1000)),
});

export type ClienteInput = z.infer<typeof clienteInputSchema>;
