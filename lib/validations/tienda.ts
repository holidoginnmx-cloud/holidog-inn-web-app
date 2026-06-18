import { z } from "zod";
import { checkbox, montoOpcionalNoNegativo, montoRequerido, opcional } from "./helpers";

// Entero >= 0 (cantidades de stock, usos máximos).
const enteroNoNegativo = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? 0 : Number(String(v).trim())),
  z.number().int("Debe ser entero").min(0, "No puede ser negativo"),
);

const enteroOpcional = z.preprocess((v) => {
  if (v === "" || v === undefined || v === null) return null;
  return Number(String(v).trim());
}, z.number().int("Debe ser entero").min(0, "No puede ser negativo").nullable());

// ── Producto ────────────────────────────────────────────────
export const productoSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(160),
  description: opcional(z.string().max(2000)),
  brand: opcional(z.string().max(80)),
  categoryId: opcional(z.string()),
  isActive: checkbox,
  isFeatured: checkbox,
});
export type ProductoInput = z.infer<typeof productoSchema>;

// Al crear, además se captura el precio y stock de la primera variante.
export const nuevoProductoSchema = productoSchema.extend({
  precio: montoRequerido,
  stock: enteroNoNegativo,
});

// ── Variante ────────────────────────────────────────────────
export const varianteSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(120),
  sku: opcional(z.string().max(80)),
  option1Name: opcional(z.string().max(60)),
  option1Value: opcional(z.string().max(120)),
  option2Name: opcional(z.string().max(60)),
  option2Value: opcional(z.string().max(120)),
  price: montoRequerido,
  compareAtPrice: montoOpcionalNoNegativo,
  isActive: checkbox,
  quantity: enteroNoNegativo,
  trackInventory: checkbox,
});
export type VarianteInput = z.infer<typeof varianteSchema>;

// ── Categoría ───────────────────────────────────────────────
export const categoriaSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  description: opcional(z.string().max(500)),
  sortOrder: enteroNoNegativo,
  isActive: checkbox,
});
export type CategoriaInput = z.infer<typeof categoriaSchema>;

// ── Descuento ───────────────────────────────────────────────
export const descuentoSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Código muy corto")
    .max(40)
    .transform((s) => s.toUpperCase()),
  type: z.enum(["PERCENT", "FIXED"]),
  value: montoRequerido,
  minSubtotal: montoOpcionalNoNegativo,
  firstOrderOnly: checkbox,
  maxUses: enteroOpcional,
  isActive: checkbox,
});
export type DescuentoInput = z.infer<typeof descuentoSchema>;

// Estado de pedido editable desde el admin.
export const estadoPedidoSchema = z.enum([
  "PENDING",
  "PAID",
  "FULFILLED",
  "CANCELLED",
  "REFUNDED",
]);

// ── Rastreo de envío (lo captura el admin al despachar) ─────
export const trackingSchema = z.object({
  trackingCarrier: opcional(z.string().max(80)),
  trackingNumber: opcional(z.string().max(120)),
});
export type TrackingInput = z.infer<typeof trackingSchema>;

// ── Configuración de envío nacional (tarifa plana; vacío = desactivado) ─────
export const envioConfigSchema = z.object({
  nationalShippingFee: montoOpcionalNoNegativo,
});
export type EnvioConfigInput = z.infer<typeof envioConfigSchema>;
