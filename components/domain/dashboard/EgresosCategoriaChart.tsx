import { formatMoneda } from "@/lib/utils";

type Dato = { categoria: string; total: number; pct: number };

// Lista de barras en HTML/CSS (estilo ranking). Evita los cortes ambiguos de
// Recharts: cada categoría tiene su fila completa, con monto y % alineados.
export function EgresosCategoriaChart({ data }: { data: Dato[] }) {
  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-neutral-muted">Sin egresos este mes.</p>;
  }

  // El ancho de cada barra es relativo al egreso más grande (ya viene ordenado desc).
  const max = Math.max(...data.map((d) => d.total));

  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.categoria}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-ink">
              {d.categoria}
            </span>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-neutral-ink">
              {formatMoneda(d.total)}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-neutral-sand">
              <div
                className="h-full rounded-full bg-brand-egreso transition-[width]"
                style={{ width: `${Math.max(3, (d.total / max) * 100)}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-xs font-medium tabular-nums text-neutral-muted">
              {Math.round(d.pct)}%
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
