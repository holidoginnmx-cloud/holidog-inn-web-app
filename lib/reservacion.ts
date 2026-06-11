// Estado de pago de una reservación, derivado de comparar lo ya pagado
// (SUM de pagos) contra el precio_acordado. No se almacena en la BD: el total
// real de una reservación siempre es SUM(pagos) y precio_acordado es lo
// cotizado (CLAUDE.md §4.1). Es ortogonal al ciclo de estancia (estado).

export type EstadoPagoKey = "PAGADA" | "PENDIENTE" | "SALDO_FAVOR" | "SIN_PRECIO";

export type EstadoPago = {
  key: EstadoPagoKey;
  /** precio_acordado - pagado. Positivo = falta cobrar; negativo = pagó de más. */
  saldo: number;
  label: string;
};

export function estadoPago(precioAcordado: number, pagado: number): EstadoPago {
  const saldo = precioAcordado - pagado;
  if (precioAcordado <= 0) {
    return { key: "SIN_PRECIO", saldo, label: "Sin precio" };
  }
  if (pagado >= precioAcordado) {
    if (pagado > precioAcordado) {
      return { key: "SALDO_FAVOR", saldo, label: "Saldo a favor" };
    }
    return { key: "PAGADA", saldo, label: "Pagada" };
  }
  return { key: "PENDIENTE", saldo, label: "Pendiente" };
}

/** Suma los montos de los pagos anidados de una reservación. */
export function sumarPagos(pagos: { monto: number | null }[] | null | undefined): number {
  return (pagos ?? []).reduce((acc, p) => acc + (p.monto ?? 0), 0);
}

// ============================================================================
//  Conversión fecha "YYYY-MM-DD" <-> timestamp de reservations
// ============================================================================
// En el esquema unificado checkIn/checkOut/appointmentAt son TIMESTAMP. El UI y
// el calendario siguen razonando en fechas "YYYY-MM-DD". Para no correr el día
// por zona horaria, los timestamps se anclan a mediodía UTC al escribir y se lee
// la parte de fecha en UTC.

/** "YYYY-MM-DD" → timestamp ISO anclado a mediodía UTC. null si no hay fecha. */
export function timestampDeFecha(fecha: string | null | undefined): string | null {
  if (!fecha) return null;
  // Acepta tanto "YYYY-MM-DD" como un ISO ya completo (toma solo la fecha).
  const soloFecha = fecha.slice(0, 10);
  return `${soloFecha}T12:00:00.000Z`;
}

/** timestamp ISO → "YYYY-MM-DD" (parte de fecha en UTC). null si no hay valor. */
export function fechaDeTimestamp(ts: string | null | undefined): string | null {
  if (!ts) return null;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}
