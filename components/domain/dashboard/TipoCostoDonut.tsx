"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { TIPO_COSTO_LABEL, type TipoCosto } from "@/lib/labels";
import { TIPO_COSTO_COLOR } from "@/lib/chart";
import { formatMoneda } from "@/lib/utils";

type Dato = { tipo: TipoCosto; total: number };

export function TipoCostoDonut({ data }: { data: Dato[] }) {
  const conMonto = data.filter((d) => d.total > 0);
  const total = conMonto.reduce((s, d) => s + d.total, 0);

  if (total <= 0) {
    return <p className="py-6 text-center text-sm text-neutral-muted">Sin egresos este mes.</p>;
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={conMonto}
              dataKey="total"
              nameKey="tipo"
              innerRadius={52}
              outerRadius={80}
              paddingAngle={2}
              stroke="none"
            >
              {conMonto.map((d) => (
                <Cell key={d.tipo} fill={TIPO_COSTO_COLOR[d.tipo]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-neutral-muted">Total</span>
          <span className="text-sm font-bold text-neutral-ink">{formatMoneda(total)}</span>
        </div>
      </div>

      <ul className="w-full space-y-1.5">
        {conMonto.map((d) => (
          <li key={d.tipo} className="flex items-center gap-2 text-sm">
            <span
              className="size-3 shrink-0 rounded-sm"
              style={{ backgroundColor: TIPO_COSTO_COLOR[d.tipo] }}
              aria-hidden
            />
            <span className="flex-1 text-neutral-ink">{TIPO_COSTO_LABEL[d.tipo]}</span>
            <span className="font-medium text-neutral-ink">{formatMoneda(d.total)}</span>
            <span className="w-10 text-right text-xs text-neutral-muted">
              {Math.round((d.total / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
