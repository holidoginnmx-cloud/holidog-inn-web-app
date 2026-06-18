"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pills } from "./Pills";
import { formatMoneda } from "@/lib/utils";
import { formatFecha, etiquetaMesAnio } from "@/lib/date";
import { SERVICIO_LABEL, SERVICIO_OPTIONS } from "@/lib/labels";
import type { ResvLite } from "@/lib/ocupacion";
import { PagoBadge } from "./PagoBadge";
import { EsteticaBadges } from "./EsteticaBadges";

const FILTRO_PILLS = [
  { value: "TODOS", label: "Todos" },
  ...SERVICIO_OPTIONS.map((s) => ({ value: s, label: SERVICIO_LABEL[s] })),
];

// Historial de reservaciones (incluye las históricas migradas del Excel).
// Lista ordenada por fecha descendente, agrupada por mes, filtrable por servicio.
export function HistorialReservaciones({ reservaciones }: { reservaciones: ResvLite[] }) {
  const [filtro, setFiltro] = useState<string>("TODOS");

  const lista = useMemo(() => {
    const filtradas =
      filtro === "TODOS" ? reservaciones : reservaciones.filter((r) => r.servicio === filtro);
    return [...filtradas].sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio));
  }, [reservaciones, filtro]);

  return (
    <div className="space-y-4">
      <Pills
        options={FILTRO_PILLS}
        value={filtro}
        onChange={setFiltro}
        ariaLabel="Filtrar por servicio"
      />

      <p className="text-sm text-neutral-muted">
        {lista.length}{" "}
        {lista.length === 1 ? "reservación" : "reservaciones"}
      </p>

      {lista.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-border p-4 text-center text-sm text-neutral-muted">
          No hay reservaciones para este filtro.
        </p>
      ) : (
        <ul className="space-y-2">
          {lista.map((r, i) => {
            const mesKey = r.fecha_inicio.slice(0, 7); // YYYY-MM
            const mesAnterior = i > 0 ? lista[i - 1]?.fecha_inicio.slice(0, 7) : null;
            const mostrarMes = mesKey !== mesAnterior;
            return (
              <li key={r.id}>
                {mostrarMes && (
                  <h2 className="mb-2 mt-4 text-sm font-semibold capitalize text-brand-teal first:mt-0">
                    {etiquetaMesAnio(Number(mesKey.slice(0, 4)), Number(mesKey.slice(5, 7)))}
                  </h2>
                )}
                <Link
                  href={`/reservaciones/${r.id}/editar`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-neutral-border bg-white p-3 active:bg-neutral-sand/60"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-neutral-ink">
                      {r.perroNombre ?? "Sin perro"}
                    </p>
                    <p className="truncate text-xs text-neutral-muted">
                      {SERVICIO_LABEL[r.servicio]} · {formatFecha(r.fecha_inicio)}
                      {r.fecha_fin && r.fecha_fin !== r.fecha_inicio
                        ? ` – ${formatFecha(r.fecha_fin)}`
                        : ""}
                    </p>
                    <EsteticaBadges
                      incluyeBano={r.incluyeBano}
                      incluyeCorte={r.incluyeCorte}
                      incluyeDeslanado={r.incluyeDeslanado}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-semibold text-neutral-ink">
                      {formatMoneda(r.precioAcordado ?? 0)}
                    </span>
                    {r.pagado != null && r.precioAcordado != null && (
                      <PagoBadge precioAcordado={r.precioAcordado} pagado={r.pagado} />
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
