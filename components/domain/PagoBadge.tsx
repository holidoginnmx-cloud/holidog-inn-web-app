import { cn, formatMoneda } from "@/lib/utils";
import { estadoPago, type EstadoPagoKey } from "@/lib/reservacion";

const TONO: Record<EstadoPagoKey, string> = {
  PAGADA: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  PENDIENTE: "bg-amber-50 text-amber-700 ring-amber-200",
  SALDO_FAVOR: "bg-sky-50 text-sky-700 ring-sky-200",
  SIN_PRECIO: "bg-neutral-sand text-neutral-muted ring-neutral-border",
};

// Píldora con el estado de pago derivado (Pagada / Pendiente $X / Saldo a favor).
export function PagoBadge({
  precioAcordado,
  pagado,
  className,
}: {
  precioAcordado: number;
  pagado: number;
  className?: string;
}) {
  const { key, saldo, label } = estadoPago(precioAcordado, pagado);
  const texto =
    key === "PENDIENTE"
      ? `${label} · ${formatMoneda(saldo)}`
      : key === "SALDO_FAVOR"
        ? `${label} · ${formatMoneda(-saldo)}`
        : label;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONO[key],
        className,
      )}
    >
      {texto}
    </span>
  );
}
