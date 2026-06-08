import type { Servicio, ReservacionEstado } from "@/lib/labels";

// Reservación ligera para los cálculos de disponibilidad del hotel.
export type ResvLite = {
  id: string;
  perroId: string;
  perroNombre: string | null;
  servicio: Servicio;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: ReservacionEstado;
  // Total cotizado de la reservación. Opcional: el calendario no lo usa, pero
  // el historial lo muestra. Los formularios arman ResvLite sin este campo.
  precioAcordado?: number;
  // Total ya pagado (SUM de pagos). Junto con precioAcordado deriva el estado
  // de pago (Pagada / Pendiente). Opcional: los formularios no lo arman.
  pagado?: number;
  // Hora de check-in / check-out ("HH:MM[:SS]"). Opcionales.
  horaCheckIn?: string | null;
  horaCheckOut?: string | null;
};

// Reservaciones que ocupan un lugar (cupo) en `fechaISO`.
// Tras la migración, ocupan cupo tanto el HOTEL (STAY) como la GUARDERIA
// (DAYCARE): la guardería ocupa un lugar ese día. La estética (BATH) no.
// (Las fechas "YYYY-MM-DD" comparan bien lexicográficamente.)
export function ocupantes(
  reservaciones: ResvLite[],
  fechaISO: string,
  excludeId?: string,
): ResvLite[] {
  return reservaciones.filter(
    (r) =>
      (r.servicio === "HOTEL" || r.servicio === "GUARDERIA") &&
      r.id !== excludeId &&
      r.fecha_inicio <= fechaISO &&
      fechaISO <= (r.fecha_fin ?? r.fecha_inicio),
  );
}

// Servicios de día que NO ocupan cupo (Estética / baño) en `fechaISO`.
// Se muestran como información adicional del día; el cupo lo manejan ocupantes().
export function serviciosDia(reservaciones: ResvLite[], fechaISO: string): ResvLite[] {
  return reservaciones.filter(
    (r) =>
      r.servicio === "ESTETICA" &&
      r.fecha_inicio <= fechaISO &&
      fechaISO <= (r.fecha_fin ?? r.fecha_inicio),
  );
}

export type Nivel = "bajo" | "medio" | "alto";

// <70% bajo (verde) · 70-90% medio (ámbar) · >90% alto (rojo).
export function nivelOcupacion(count: number, cupo: number): Nivel {
  const pct = cupo > 0 ? count / cupo : 0;
  if (pct < 0.7) return "bajo";
  if (pct <= 0.9) return "medio";
  return "alto";
}

export const NIVEL_BARRA: Record<Nivel, string> = {
  bajo: "bg-emerald-500",
  medio: "bg-amber-500",
  alto: "bg-rose-500",
};

export const NIVEL_CELDA: Record<Nivel, string> = {
  bajo: "bg-emerald-100 text-emerald-900",
  medio: "bg-amber-100 text-amber-900",
  alto: "bg-rose-100 text-rose-900",
};
