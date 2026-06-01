import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn, formatMoneda } from "@/lib/utils";

// Variación porcentual vs. mes anterior. null = no hay base de comparación.
function variacion(actual: number, previo: number): number | null {
  if (previo === 0) return actual === 0 ? 0 : null;
  return ((actual - previo) / Math.abs(previo)) * 100;
}

function DeltaChip({
  actual,
  previo,
  buenoSiSube,
  claro = false,
}: {
  actual: number;
  previo: number;
  buenoSiSube: boolean;
  claro?: boolean;
}) {
  const pct = variacion(actual, previo);
  if (pct === null) {
    return <span className={cn("text-xs", claro ? "text-white/70" : "text-neutral-muted")}>nuevo</span>;
  }
  const sube = pct >= 0;
  const bueno = sube === buenoSiSube;
  const color = claro
    ? "text-white"
    : bueno
      ? "text-emerald-600"
      : "text-rose-600";
  return (
    <span className={cn("flex items-center gap-0.5 text-xs font-medium", color)}>
      {sube ? <ArrowUpRight className="size-3.5" aria-hidden /> : <ArrowDownRight className="size-3.5" aria-hidden />}
      {sube ? "+" : "−"}
      {Math.abs(Math.round(pct))}%
    </span>
  );
}

export function KpiCards({
  ingresos,
  egresos,
  utilidad,
  ingresosPrev,
  egresosPrev,
  utilidadPrev,
}: {
  ingresos: number;
  egresos: number;
  utilidad: number;
  ingresosPrev: number;
  egresosPrev: number;
  utilidadPrev: number;
}) {
  const positiva = utilidad >= 0;

  return (
    <>
      <div className="rounded-xl border border-neutral-border bg-white p-4">
        <p className="text-sm text-neutral-muted">Ingresos</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-brand-ingreso">
          {formatMoneda(ingresos)}
        </p>
        <div className="mt-1.5">
          <DeltaChip actual={ingresos} previo={ingresosPrev} buenoSiSube />
        </div>
      </div>

      <div className="rounded-xl border border-neutral-border bg-white p-4">
        <p className="text-sm text-neutral-muted">Egresos</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-brand-egreso">
          {formatMoneda(egresos)}
        </p>
        <div className="mt-1.5">
          <DeltaChip actual={egresos} previo={egresosPrev} buenoSiSube={false} />
        </div>
      </div>

      <div
        className={cn(
          "rounded-xl border p-4",
          positiva ? "border-transparent bg-brand-ingreso text-white" : "border-rose-200 bg-rose-50 text-rose-900",
        )}
      >
        <p className={cn("text-sm", positiva ? "text-white/85" : "text-rose-700")}>Utilidad</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">{formatMoneda(utilidad)}</p>
        <div className="mt-1.5">
          <DeltaChip actual={utilidad} previo={utilidadPrev} buenoSiSube claro={positiva} />
        </div>
      </div>
    </>
  );
}
