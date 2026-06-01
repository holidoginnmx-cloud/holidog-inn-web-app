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
