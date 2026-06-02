import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Anillo de foco de teclado consistente para controles personalizados (los que
// no usan el componente <Button>, que ya lo trae). WCAG 2.4.7.
export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-cream";

const fmtMoneda = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

export function formatMoneda(monto: number | null | undefined): string {
  return fmtMoneda.format(monto ?? 0);
}

// Moneda sin centavos (tablas estilo Excel del dashboard).
const fmtMonedaEntera = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

export function formatMonedaEntera(monto: number | null | undefined): string {
  return fmtMonedaEntera.format(monto ?? 0);
}

// Porcentaje con 2 decimales. Recibe la fracción (0.15 → "15.00 %").
const fmtPorcentaje = new Intl.NumberFormat("es-MX", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPorcentaje(fraccion: number | null | undefined): string {
  return fmtPorcentaje.format(fraccion ?? 0);
}

// Notación compacta para ejes de gráficas (1234 → "1.2k").
const fmtCompacto = new Intl.NumberFormat("es-MX", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCompacto(valor: number | null | undefined): string {
  return fmtCompacto.format(valor ?? 0);
}
