import { z } from "zod";

// Normaliza valores de inputs HTML / FormData: undefined | null | "" → null,
// y recorta strings. Si tras recortar queda vacío, también → null.
export function opcional<T extends z.ZodTypeAny>(inner: T) {
  return z.preprocess((v) => {
    if (v === undefined || v === null) return null;
    if (typeof v === "string") {
      const t = v.trim();
      return t === "" ? null : t;
    }
    return v;
  }, inner.nullable());
}

// Checkbox/switch: acepta boolean nativo (RHF) o string ("true"/"on"/"1" de FormData).
export const checkbox = z.preprocess(
  (v) => v === true || v === "true" || v === "on" || v === "1",
  z.boolean(),
);

// "YYYY-MM-DD" opcional (input type="date").
export const fechaOpcional = opcional(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"));

// "YYYY-MM-DD" obligatoria.
export const fechaRequerida = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");

// Monto obligatorio: convierte string → number, debe ser > 0.
export const montoRequerido = z.preprocess(
  (v) => {
    if (v === "" || v === undefined || v === null) return Number.NaN;
    const n = typeof v === "number" ? v : Number(String(v).trim());
    return Number.isNaN(n) ? Number.NaN : n;
  },
  z.number().positive("El monto debe ser mayor a 0").max(1_000_000, "Monto fuera de rango"),
);

// Monto obligatorio que admite 0 (p. ej. precio acordado).
export const montoNoNegativo = z.preprocess(
  (v) => {
    if (v === "" || v === undefined || v === null) return Number.NaN;
    const n = typeof v === "number" ? v : Number(String(v).trim());
    return Number.isNaN(n) ? Number.NaN : n;
  },
  z.number().min(0, "No puede ser negativo").max(10_000_000, "Monto fuera de rango"),
);

// Monto opcional (>= 0): "" → null.
export const montoOpcionalNoNegativo = z.preprocess((v) => {
  if (v === "" || v === undefined || v === null) return null;
  const n = typeof v === "number" ? v : Number(String(v).trim());
  return Number.isNaN(n) ? Number.NaN : n;
}, z.number().min(0, "No puede ser negativo").max(10_000_000, "Monto fuera de rango").nullable());
