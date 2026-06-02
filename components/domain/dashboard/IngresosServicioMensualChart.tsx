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
import { SERVICIO_LABEL, SERVICIO_OPTIONS } from "@/lib/labels";
import { SERVICIO_COLOR } from "@/lib/chart";
import { formatCompacto, formatMoneda } from "@/lib/utils";

export type FilaMes = {
  label: string;
  HOTEL: number;
  ESTETICA: number;
  GUARDERIA: number;
  /** Mes en curso (datos parciales): se marca para no leerse como caída. */
  enCurso?: boolean;
};

export function IngresosServicioMensualChart({ data }: { data: FilaMes[] }) {
  const hayDatos = data.some((d) => d.HOTEL + d.ESTETICA + d.GUARDERIA > 0);
  const mesEnCurso = data.find((d) => d.enCurso)?.label;

  if (!hayDatos) {
    return <p className="py-6 text-center text-sm text-neutral-muted">Sin ingresos este año.</p>;
  }

  return (
    <div className="space-y-2">
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5DDD0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#6B6B6B" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: string) => (v === mesEnCurso ? `${v} *` : v)}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6B6B6B" }}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(v: number) => formatCompacto(Number(v))}
          />
          <Tooltip
            formatter={(value, name) => [formatMoneda(Number(value)), name as string]}
            labelFormatter={(label) =>
              label === mesEnCurso ? `${label} (en curso)` : String(label)
            }
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {SERVICIO_OPTIONS.map((s) => (
            <Line
              key={s}
              type="monotone"
              dataKey={s}
              name={SERVICIO_LABEL[s]}
              stroke={SERVICIO_COLOR[s]}
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {mesEnCurso && (
        <p className="text-xs text-neutral-muted">* {mesEnCurso}: mes en curso, datos parciales.</p>
      )}
    </div>
  );
}
