"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { SERVICIO_LABEL, SERVICIO_OPTIONS } from "@/lib/labels";
import { SERVICIO_COLOR } from "@/lib/chart";
import { formatMoneda } from "@/lib/utils";

export type FilaMes = { label: string; HOTEL: number; ESTETICA: number; GUARDERIA: number };

const compacto = (v: number) =>
  new Intl.NumberFormat("es-MX", { notation: "compact", maximumFractionDigits: 1 }).format(v);

export function IngresosServicioMensualChart({ data }: { data: FilaMes[] }) {
  const hayDatos = data.some((d) => d.HOTEL + d.ESTETICA + d.GUARDERIA > 0);

  return (
    <div className="rounded-xl border border-neutral-border bg-white p-4">
      <p className="text-sm font-medium text-neutral-ink">Ingresos por servicio · mensual</p>
      <p className="mb-2 text-xs text-neutral-muted">Hotel · Estética · Guardería</p>
      {hayDatos ? (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
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
            {SERVICIO_OPTIONS.map((s) => (
              <Bar key={s} dataKey={s} name={SERVICIO_LABEL[s]} stackId="a" fill={SERVICIO_COLOR[s]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="py-10 text-center text-sm text-neutral-muted">Sin ingresos este año.</p>
      )}
    </div>
  );
}
