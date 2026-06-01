"use client";

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { nivelOcupacion, type Nivel } from "@/lib/ocupacion";

// Hex equivalentes de NIVEL_BARRA (emerald/amber/rose-500) para el fill de Recharts.
const NIVEL_HEX: Record<Nivel, string> = {
  bajo: "#10b981",
  medio: "#f59e0b",
  alto: "#f43f5e",
};

const NIVEL_TEXTO: Record<Nivel, string> = {
  bajo: "Disponible",
  medio: "Casi lleno",
  alto: "Lleno",
};

export function GaugeOcupacion({ valor, cupo }: { valor: number; cupo: number }) {
  const nivel = nivelOcupacion(valor, cupo);
  const fill = NIVEL_HEX[nivel];

  return (
    <div className="rounded-xl border border-neutral-border bg-white p-4">
      <p className="text-sm text-neutral-muted">Ocupación de hoy</p>
      <div className="relative mx-auto mt-1 h-28">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="72%"
            outerRadius="100%"
            data={[{ value: valor }]}
            startAngle={180}
            endAngle={0}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <PolarAngleAxis type="number" domain={[0, Math.max(cupo, 1)]} tick={false} />
            <RadialBar
              dataKey="value"
              cornerRadius={10}
              fill={fill}
              background={{ fill: "#F0E8D8" }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        {/* Etiqueta central superpuesta sobre el medio círculo. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-1">
          <p className="text-3xl font-bold tracking-tight text-neutral-ink">
            {valor}
            <span className="text-base font-normal text-neutral-muted"> / {cupo}</span>
          </p>
          <p className="text-xs font-medium" style={{ color: fill }}>
            {NIVEL_TEXTO[nivel]}
          </p>
        </div>
      </div>
    </div>
  );
}
