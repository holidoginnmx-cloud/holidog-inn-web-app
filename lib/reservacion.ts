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
