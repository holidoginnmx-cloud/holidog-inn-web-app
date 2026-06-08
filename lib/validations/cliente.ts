import { z } from "zod";
import { opcional } from "./helpers";

// Validación autoritativa (server-side) de los datos de un cliente.
// NOTA migración: el cliente vive en `users` (role='OWNER'). El nombre completo
// va en `firstName`. `notas` NO tiene columna equivalente en `users`, así que se
// valida en el form pero se IGNORA al escribir (ver perros/actions.ts).
export const clienteInputSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre del cliente es obligatorio").max(120),
  telefono: opcional(z.string().max(40)),
  email: opcional(z.email("Correo electrónico inválido")),
  notas: opcional(z.string().max(1000)),
});

export type ClienteInput = z.infer<typeof clienteInputSchema>;
