"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { COLOR } from "@/lib/chart";
import { formatMoneda } from "@/lib/utils";

type Punto = { label: string; ingresos: number; egresos: number; utilidad: number };

const compacto = (v: number) =>
  new Intl.NumberFormat("es-MX", { notation: "compact", maximumFractionDigits: 1 }).format(v);

export function TendenciaChart({ data }: { data: Punto[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="gradUtilidad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={COLOR.teal} />
            <stop offset="100%" stopColor={COLOR.mustard} />
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
          tickFormatter={(v: number) => compacto(Number(v))}
        />
        <Tooltip formatter={(value) => formatMoneda(Number(value))} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="ingresos"
          name="Ingresos"
          stroke={COLOR.teal}
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="egresos"
          name="Egresos"
          stroke={COLOR.mustard}
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="utilidad"
          name="Utilidad"
          stroke="url(#gradUtilidad)"
          strokeWidth={3}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
