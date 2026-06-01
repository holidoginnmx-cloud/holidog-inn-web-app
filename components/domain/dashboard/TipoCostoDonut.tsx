"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { AlertTriangle } from "lucide-react";
import { TIPO_COSTO_LABEL, type TipoCosto } from "@/lib/labels";
import {
  COLOR_ESTADO_EGRESO,
  UMBRAL_ALERTA_TIPO_COSTO,
  esAlertaTipoCosto,
  colorTipoCosto,
} from "@/lib/chart";
import { formatMoneda } from "@/lib/utils";

type Dato = { tipo: TipoCosto; total: number };

export function TipoCostoDonut({ data }: { data: Dato[] }) {
  const conMonto = data.filter((d) => d.total > 0);
  const total = conMonto.reduce((s, d) => s + d.total, 0);

  if (total <= 0) {
    return <p className="py-6 text-center text-sm text-neutral-muted">Sin egresos este mes.</p>;
  }

  // Cada rubro con su % sobre el total de egresos y su estado de alerta.
  const items = conMonto.map((d) => {
    const pct = (d.total / total) * 100;
    return {
      ...d,
      pct,
      alerta: esAlertaTipoCosto(d.tipo, pct),
      color: colorTipoCosto(d.tipo, pct),
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="relative h-44 w-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={items}
                dataKey="total"
                nameKey="tipo"
                innerRadius={52}
                outerRadius={80}
                paddingAngle={2}
                stroke="none"
              >
                {items.map((d) => (
                  <Cell key={d.tipo} fill={d.color} />
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
          {items.map((d) => {
            const umbral = UMBRAL_ALERTA_TIPO_COSTO[d.tipo];
            return (
              <li
                key={d.tipo}
                className="flex items-center gap-2 text-sm"
                title={
                  d.alerta && umbral != null
                    ? `Supera el ${umbral}% recomendado`
                    : undefined
                }
              >
                <span
                  className="size-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: d.color }}
                  aria-hidden
                />
                <span className="flex flex-1 items-center gap-1 text-neutral-ink">
                  {TIPO_COSTO_LABEL[d.tipo]}
                  {d.alerta && (
                    <AlertTriangle
                      className="size-3.5 shrink-0 text-brand-egreso"
                      aria-label="Fuera de rango"
                    />
                  )}
                </span>
                <span className="font-medium text-neutral-ink">{formatMoneda(d.total)}</span>
                <span
                  className={
                    d.alerta
                      ? "w-10 text-right text-xs font-semibold text-brand-egreso"
                      : "w-10 text-right text-xs text-neutral-muted"
                  }
                >
                  {Math.round(d.pct)}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Leyenda de estados: el color ahora indica si el rubro está dentro de rango. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-neutral-muted">
        <span className="flex items-center gap-1.5">
          <span
            className="size-3 rounded-sm"
            style={{ backgroundColor: COLOR_ESTADO_EGRESO.ok }}
            aria-hidden
          />
          Dentro de rango
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="size-3 rounded-sm"
            style={{ backgroundColor: COLOR_ESTADO_EGRESO.alerta }}
            aria-hidden
          />
          Fuera de rango (alerta)
        </span>
      </div>
    </div>
  );
}
