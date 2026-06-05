"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { COLOR } from "@/lib/chart";
import { formatCompacto, formatMoneda } from "@/lib/utils";

type Punto = { label: string; ingresos: number; egresos: number; utilidad: number };

export function TendenciaArea({ data }: { data: Punto[] }) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-neutral-border bg-white p-4">
      <p className="text-sm font-medium text-neutral-ink">Tendencia · 6 meses</p>
      <p className="mb-2 text-xs text-neutral-muted">Ingresos vs. egresos</p>
      {/* flex-1 + min-h: en escritorio el chart crece para llenar la tarjeta
          (que se estira a la altura del Top perros); en móvil mantiene 220px. */}
      <div className="min-h-[220px] flex-1">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: 220 }}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="areaIngresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLOR.ingreso} stopOpacity={0.45} />
              <stop offset="100%" stopColor={COLOR.ingreso} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="areaEgresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLOR.egreso} stopOpacity={0.3} />
              <stop offset="100%" stopColor={COLOR.egreso} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5DDD0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#6B6B6B" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6B6B6B" }}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(v: number) => formatCompacto(Number(v))}
          />
          <Tooltip formatter={(value) => formatMoneda(Number(value))} />
          <Area
            type="monotone"
            dataKey="egresos"
            name="Egresos"
            stroke={COLOR.egreso}
            strokeWidth={2}
            fill="url(#areaEgresos)"
          />
          <Area
            type="monotone"
            dataKey="ingresos"
            name="Ingresos"
            stroke={COLOR.ingreso}
            strokeWidth={2}
            fill="url(#areaIngresos)"
          />
        </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
