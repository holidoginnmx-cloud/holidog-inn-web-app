"use client";

import { useState } from "react";
import { Pills } from "./Pills";
import { ReservacionesCalendar } from "./ReservacionesCalendar";
import { HistorialReservaciones } from "./HistorialReservaciones";
import type { ResvLite } from "@/lib/ocupacion";

type Tab = "calendario" | "historial";
const TAB_PILLS = [
  { value: "calendario", label: "Calendario" },
  { value: "historial", label: "Historial" },
];

// Pantalla de reservaciones: alterna entre el calendario de ocupación
// (activo + histórico al navegar meses) y el historial buscable.
export function ReservacionesScreen({
  reservaciones,
  cupo,
  todayISO,
}: {
  reservaciones: ResvLite[];
  cupo: number;
  todayISO: string;
}) {
  const [tab, setTab] = useState<Tab>("calendario");

  return (
    <div className="space-y-4">
      <Pills
        options={TAB_PILLS}
        value={tab}
        onChange={(v) => setTab(v as Tab)}
        ariaLabel="Sección de reservaciones"
      />

      {tab === "calendario" ? (
        <ReservacionesCalendar reservaciones={reservaciones} cupo={cupo} todayISO={todayISO} />
      ) : (
        <HistorialReservaciones reservaciones={reservaciones} />
      )}
    </div>
  );
}
