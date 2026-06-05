"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatMoneda } from "@/lib/utils";

type Dato = { categoria: string; total: number; pct: number };

// Cuántas categorías se muestran como rebanada antes de agrupar en "Otros".
const TOP = 6;

type Rebanada = { name: string; total: number; pct: number; fill: string; otros: boolean };

// Dona de egresos por categoría: las TOP mayores como rebanadas y el resto
// agrupado en "Otros". Familia roja (egresos), del más oscuro (mayor) al más
// claro; "Otros" en un tono neutro para distinguirlo del ranking.
export function EgresosCategoriaChart({ data }: { data: Dato[] }) {
  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-neutral-muted">Sin egresos registrados.</p>;
  }

  // `data` ya viene ordenado desc.
  const rebanadas: Rebanada[] = [];
  const cabe = data.length <= TOP + 1 ? data.length : TOP;
  data.slice(0, cabe).forEach((d, i) => {
    rebanadas.push({
      name: d.categoria,
      total: d.total,
      pct: d.pct,
      fill: `hsl(0, 72%, ${44 + i * 5}%)`,
      otros: false,
    });
  });
  const resto = data.slice(cabe);
  if (resto.length > 0) {
    rebanadas.push({
      name: `Otros (${resto.length})`,
      total: resto.reduce((s, d) => s + d.total, 0),
      pct: resto.reduce((s, d) => s + d.pct, 0),
      fill: "#B8AE9C",
      otros: true,
    });
  }

  const total = data.reduce((s, d) => s + d.total, 0);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 176, height: 176 }}>
          <PieChart>
            <Pie
              data={rebanadas}
              dataKey="total"
              nameKey="name"
              innerRadius={52}
              outerRadius={80}
              paddingAngle={2}
              stroke="none"
              isAnimationActive={false}
            >
              {rebanadas.map((r) => (
                <Cell key={r.name} fill={r.fill} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatMoneda(Number(value))}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5DDD0" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-neutral-muted">Total</span>
          <span className="text-sm font-bold text-neutral-ink">{formatMoneda(total)}</span>
        </div>
      </div>

      <ul className="w-full space-y-1.5">
        {rebanadas.map((r) => (
          <li key={r.name} className="flex items-center gap-2 text-sm">
            <span
              className="size-3 shrink-0 rounded-sm"
              style={{ backgroundColor: r.fill }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-neutral-ink">{r.name}</span>
            <span className="shrink-0 font-medium tabular-nums text-neutral-ink">
              {formatMoneda(r.total)}
            </span>
            <span className="w-10 shrink-0 text-right text-xs tabular-nums text-neutral-muted">
              {Math.round(r.pct)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
