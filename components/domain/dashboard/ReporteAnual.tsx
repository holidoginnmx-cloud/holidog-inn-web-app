import { cn } from "@/lib/utils";

// Reporte anual estilo Excel (hoja "Reporte Mensual"): meses en columnas y
// filas por servicio + totales. Server Component: solo presentación tabular.

export type ReporteAnualData = {
  anio: number;
  meses: string[]; // etiquetas de columna, p. ej. ["ene", "feb", …]
  hotel: number[];
  estetica: number[];
  guarderia: number[];
  egresos: number[];
};

// Formato compacto sin símbolo ni decimales: las celdas son angostas en móvil
// y la sección ya deja claro que son pesos.
const fmtNum = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 });
const fmtMon = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

type Fila = {
  label: string;
  valores: number[];
  variante: "servicio" | "total" | "egreso" | "resultado";
};

function sumar(a: number[]): number {
  return a.reduce((acc, n) => acc + n, 0);
}

export function ReporteAnual({ data }: { data: ReporteAnualData }) {
  const { meses, hotel, estetica, guarderia, egresos } = data;

  if (meses.length === 0) {
    return <p className="py-6 text-center text-sm text-neutral-muted">Sin movimientos este año.</p>;
  }

  const totalIngresos = meses.map(
    (_, i) => (hotel[i] ?? 0) + (estetica[i] ?? 0) + (guarderia[i] ?? 0),
  );
  const resultado = meses.map((_, i) => (totalIngresos[i] ?? 0) - (egresos[i] ?? 0));

  const filas: Fila[] = [
    { label: "Hotel", valores: hotel, variante: "servicio" },
    { label: "Estética", valores: estetica, variante: "servicio" },
    { label: "Guardería", valores: guarderia, variante: "servicio" },
    { label: "Total ingresos", valores: totalIngresos, variante: "total" },
    { label: "Egresos", valores: egresos, variante: "egreso" },
    { label: "Resultado", valores: resultado, variante: "resultado" },
  ];

  // Proyección anual = promedio mensual (sobre meses con datos) × 12.
  const n = meses.length;
  const proyeccion = {
    ingresos: (sumar(totalIngresos) / n) * 12,
    egresos: (sumar(egresos) / n) * 12,
    resultado: (sumar(resultado) / n) * 12,
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs tabular-nums">
          <thead>
            <tr className="border-b border-neutral-border">
              <th className="sticky left-0 z-10 border-r border-neutral-border bg-white py-2 pr-3 pl-0 text-left font-medium text-neutral-muted" />
              {meses.map((m) => (
                <th key={m} className="px-2 py-2 text-right font-medium capitalize text-neutral-muted">
                  {m}
                </th>
              ))}
              <th className="px-2 py-2 text-right font-semibold text-neutral-ink">Total</th>
              <th className="px-2 py-2 text-right font-medium text-neutral-muted">Prom.</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => {
              const total = sumar(fila.valores);
              const promedio = total / n;
              const esResaltada = fila.variante === "total" || fila.variante === "resultado";
              // Tinte de la fila (semi-transparente, sobre la tarjeta blanca).
              const rowBg =
                fila.variante === "total"
                  ? "bg-brand-ingreso/5"
                  : fila.variante === "resultado"
                    ? "bg-neutral-sand/50"
                    : "bg-white";
              // La celda fija necesita fondo OPACO (equivalente al tinte) para
              // que las columnas no se transparenten por debajo al hacer scroll.
              const stickyBg =
                fila.variante === "total"
                  ? "bg-[#F1F9F4]"
                  : fila.variante === "resultado"
                    ? "bg-[#F7F2E9]"
                    : "bg-white";
              return (
                <tr
                  key={fila.label}
                  className={cn("border-b border-neutral-border/60", rowBg)}
                >
                  <th
                    scope="row"
                    className={cn(
                      "sticky left-0 z-10 whitespace-nowrap border-r border-neutral-border py-1.5 pr-3 text-left",
                      stickyBg,
                      esResaltada ? "font-semibold text-neutral-ink" : "font-medium text-neutral-muted",
                    )}
                  >
                    {fila.label}
                  </th>
                  {fila.valores.map((v, i) => (
                    <td
                      key={i}
                      className={cn(
                        "whitespace-nowrap px-2 py-1.5 text-right",
                        celdaColor(fila.variante, v),
                      )}
                    >
                      {fmtNum.format(v)}
                    </td>
                  ))}
                  <td
                    className={cn(
                      "whitespace-nowrap px-2 py-1.5 text-right font-semibold",
                      celdaColor(fila.variante, total),
                    )}
                  >
                    {fmtNum.format(total)}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-right text-neutral-muted">
                    {fmtNum.format(Math.round(promedio))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Proyección anual (promedio × 12), como las columnas de gestión del Excel. */}
      <div>
        <p className="mb-2 text-xs font-medium text-neutral-muted">Proyección anual</p>
        <div className="grid grid-cols-3 gap-2">
          <ProyeccionCard label="Ingresos" monto={proyeccion.ingresos} tono="ingreso" />
          <ProyeccionCard label="Egresos" monto={proyeccion.egresos} tono="egreso" />
          <ProyeccionCard label="Resultado" monto={proyeccion.resultado} tono="resultado" />
        </div>
      </div>
    </div>
  );
}

function celdaColor(variante: Fila["variante"], valor: number): string {
  if (variante === "total") return "font-semibold text-brand-ingreso";
  if (variante === "resultado") {
    return valor < 0 ? "font-semibold text-brand-egreso" : "font-semibold text-brand-ingreso";
  }
  if (variante === "egreso") return "text-brand-egreso";
  return "text-neutral-ink";
}

function ProyeccionCard({
  label,
  monto,
  tono,
}: {
  label: string;
  monto: number;
  tono: "ingreso" | "egreso" | "resultado";
}) {
  const color =
    tono === "ingreso"
      ? "text-brand-ingreso"
      : tono === "resultado"
        ? monto < 0
          ? "text-brand-egreso"
          : "text-brand-ingreso"
        : "text-brand-egreso";
  return (
    <div className="rounded-lg border border-neutral-border bg-neutral-sand/40 p-2.5">
      <p className="text-[11px] text-neutral-muted">{label}</p>
      <p className={cn("text-sm font-semibold tabular-nums", color)}>{fmtMon.format(monto)}</p>
    </div>
  );
}
