"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { SERVICIO_LABEL, SERVICIO_OPTIONS, type Servicio } from "@/lib/labels";
import { SERVICIO_COLOR } from "@/lib/chart";
import { formatMoneda } from "@/lib/utils";

type Dato = { servicio: Servicio; total: number; pct: number };

export function IngresosServicioChart({ data }: { data: Dato[] }) {
  const total = data.reduce((s, d) => s + d.total, 0);

  if (total <= 0) {
    return <p className="py-6 text-center text-sm text-neutral-muted">Sin ingresos este mes.</p>;
  }

  // Una sola barra apilada horizontal.
  const fila: Record<string, number | string> = { name: "ingresos" };
  for (const d of data) fila[d.servicio] = d.total;

  // Orden estable y solo servicios con monto.
  const presentes = SERVICIO_OPTIONS.filter((s) => (fila[s] as number) > 0);
  const porServicio = new Map(data.map((d) => [d.servicio, d]));

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={40}>
        <BarChart layout="vertical" data={[fila]} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" hide />
          {presentes.map((s, i) => {
            const radius: number | [number, number, number, number] =
              presentes.length === 1
                ? 6
                : i === 0
                  ? [6, 0, 0, 6]
                  : i === presentes.length - 1
                    ? [0, 6, 6, 0]
                    : 0;
            return <Bar key={s} dataKey={s} stackId="a" fill={SERVICIO_COLOR[s]} radius={radius} />;
          })}
        </BarChart>
      </ResponsiveContainer>

      <ul className="space-y-1.5">
        {SERVICIO_OPTIONS.map((s) => {
          const d = porServicio.get(s);
          if (!d || d.total <= 0) return null;
          return (
            <li key={s} className="flex items-center gap-2 text-sm">
              <span
                className="size-3 shrink-0 rounded-sm"
                style={{ backgroundColor: SERVICIO_COLOR[s] }}
                aria-hidden
              />
              <span className="flex-1 text-neutral-ink">{SERVICIO_LABEL[s]}</span>
              <span className="font-medium text-neutral-ink">{formatMoneda(d.total)}</span>
              <span className="w-10 text-right text-xs text-neutral-muted">
                {Math.round(d.pct)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
