"use client";

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { AlertTriangle } from "lucide-react";
import { COLOR, UMBRAL_MARGEN_MIN } from "@/lib/chart";

// Margen de utilidad (utilidad / ingresos). Puede ser negativo si hay pérdida;
// el gauge se acota a [0, 100] visualmente. Se marca en alerta (rojo) cuando el
// margen cae por debajo del mínimo saludable (UMBRAL_MARGEN_MIN).
export function GaugeMargen({ margen }: { margen: number }) {
  const alerta = margen < UMBRAL_MARGEN_MIN;
  const fill = alerta ? COLOR.egreso : COLOR.ingreso;
  const visual = Math.max(0, Math.min(margen, 100));

  return (
    <div className="rounded-xl border border-neutral-border bg-white p-4">
      <p className="text-sm text-neutral-muted">Margen de utilidad</p>
      <div className="relative mx-auto mt-1 h-28">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 300, height: 112 }}>
          <RadialBarChart
            innerRadius="72%"
            outerRadius="100%"
            data={[{ value: visual }]}
            startAngle={180}
            endAngle={0}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              dataKey="value"
              cornerRadius={10}
              fill={fill}
              background={{ fill: "#F0E8D8" }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-1">
          <p className="text-3xl font-bold tracking-tight" style={{ color: fill }}>
            {Math.round(margen)}%
          </p>
          <p className="text-xs font-normal text-neutral-muted">del ingreso</p>
        </div>
      </div>
      {alerta && (
        <p className="mt-1 flex items-center justify-center gap-1 text-xs font-medium text-brand-egreso">
          <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
          Bajo el mínimo del {UMBRAL_MARGEN_MIN}%
        </p>
      )}
    </div>
  );
}
