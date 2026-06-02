import { cn, formatMonedaEntera } from "@/lib/utils";
import { CELDA } from "@/lib/chart";

// Reporte anual estilo Excel: un renglón por mes y columnas por servicio +
// ingresos / egresos / resultado. Misma estética que el Resumen de costos
// (celda de resultado con relleno verde/rojo). Server Component: presentación.

export type ReporteAnualData = {
  anio: number;
  meses: string[]; // etiquetas de renglón, p. ej. ["ene", "feb", …]
  hotel: number[];
  estetica: number[];
  guarderia: number[];
  egresos: number[];
  enCurso: boolean[]; // mes en curso (datos parciales)
};

// Formato compacto sin símbolo ni decimales: las celdas son angostas en móvil
// y la sección ya deja claro que son pesos.
const fmtNum = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 });

function sumar(a: number[]): number {
  return a.reduce((acc, n) => acc + n, 0);
}

// Columnas de datos, en orden. `tono` define el color del texto del número.
const COLUMNAS = [
  { key: "hotel", label: "Hotel", tono: "ink" },
  { key: "estetica", label: "Estética", tono: "ink" },
  { key: "guarderia", label: "Guardería", tono: "ink" },
  { key: "ingresos", label: "Ingresos", tono: "ingreso" },
  { key: "egresos", label: "Egresos", tono: "egreso" },
  { key: "resultado", label: "Resultado", tono: "resultado" },
] as const;

const tonoTexto: Record<string, string> = {
  ink: "text-neutral-ink",
  ingreso: "font-semibold text-brand-ingreso",
  egreso: "text-brand-egreso",
  resultado: "",
};

export function ReporteAnual({ data }: { data: ReporteAnualData }) {
  const { meses, hotel, estetica, guarderia, egresos, enCurso } = data;

  if (meses.length === 0) {
    return <p className="py-6 text-center text-sm text-neutral-muted">Sin movimientos este año.</p>;
  }

  const ingresos = meses.map(
    (_, i) => (hotel[i] ?? 0) + (estetica[i] ?? 0) + (guarderia[i] ?? 0),
  );
  const resultado = meses.map((_, i) => (ingresos[i] ?? 0) - (egresos[i] ?? 0));
  const n = meses.length;

  // Valores por columna para una fila dada (mes índice i).
  const valoresFila = (i: number) => ({
    hotel: hotel[i] ?? 0,
    estetica: estetica[i] ?? 0,
    guarderia: guarderia[i] ?? 0,
    ingresos: ingresos[i] ?? 0,
    egresos: egresos[i] ?? 0,
    resultado: resultado[i] ?? 0,
  });

  // Totales y promedios por columna (para las filas de pie).
  const totales = {
    hotel: sumar(hotel),
    estetica: sumar(estetica),
    guarderia: sumar(guarderia),
    ingresos: sumar(ingresos),
    egresos: sumar(egresos),
    resultado: sumar(resultado),
  };

  const proyeccion = {
    ingresos: (totales.ingresos / n) * 12,
    egresos: (totales.egresos / n) * 12,
    resultado: (totales.resultado / n) * 12,
  };

  // Clase de la celda de resultado según el signo (verde utilidad / rojo pérdida).
  const celdaResultado = (v: number) =>
    cn(
      "whitespace-nowrap px-2 py-1.5 text-right font-semibold",
      v < 0 ? CELDA.alerta : CELDA.ok,
    );

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs tabular-nums">
          <thead>
            <tr className="border-b border-neutral-border">
              <th className="sticky left-0 z-10 bg-white py-2 pr-3 pl-0 text-left font-medium text-neutral-muted">
                Mes
              </th>
              {COLUMNAS.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "px-2 py-2 text-right",
                    c.key === "resultado"
                      ? "font-semibold text-neutral-ink"
                      : "font-medium text-neutral-muted",
                  )}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {meses.map((m, i) => {
              const v = valoresFila(i);
              return (
                <tr key={m} className="border-b border-neutral-border/60">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 whitespace-nowrap bg-white py-1.5 pr-3 text-left font-medium capitalize text-neutral-ink"
                  >
                    {m}
                    {enCurso[i] ? " *" : ""}
                  </th>
                  {COLUMNAS.map((c) =>
                    c.key === "resultado" ? (
                      <td key={c.key} className={celdaResultado(v.resultado)}>
                        {fmtNum.format(v.resultado)}
                      </td>
                    ) : (
                      <td
                        key={c.key}
                        className={cn(
                          "whitespace-nowrap px-2 py-1.5 text-right",
                          tonoTexto[c.tono],
                        )}
                      >
                        {fmtNum.format(v[c.key])}
                      </td>
                    ),
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-neutral-border bg-neutral-sand/40">
              <th
                scope="row"
                className="sticky left-0 z-10 whitespace-nowrap bg-[#F7F2E9] py-1.5 pr-3 text-left font-semibold text-neutral-ink"
              >
                Total
              </th>
              {COLUMNAS.map((c) =>
                c.key === "resultado" ? (
                  <td key={c.key} className={celdaResultado(totales.resultado)}>
                    {fmtNum.format(totales.resultado)}
                  </td>
                ) : (
                  <td
                    key={c.key}
                    className={cn(
                      "whitespace-nowrap px-2 py-1.5 text-right font-semibold",
                      tonoTexto[c.tono],
                    )}
                  >
                    {fmtNum.format(totales[c.key])}
                  </td>
                ),
              )}
            </tr>
            <tr>
              <th
                scope="row"
                className="sticky left-0 z-10 whitespace-nowrap bg-white py-1.5 pr-3 text-left font-medium text-neutral-muted"
              >
                Prom.
              </th>
              {COLUMNAS.map((c) => (
                <td
                  key={c.key}
                  className="whitespace-nowrap px-2 py-1.5 text-right text-neutral-muted"
                >
                  {fmtNum.format(Math.round(totales[c.key] / n))}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Leyenda + nota del mes en curso. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-[#E7F6EC] ring-1 ring-[#15803D]/30" aria-hidden />
          Utilidad
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-[#FCE8E8] ring-1 ring-[#B91C1C]/30" aria-hidden />
          Pérdida
        </span>
        {enCurso.some(Boolean) && <span>* mes en curso (parcial)</span>}
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
      <p className={cn("text-sm font-semibold tabular-nums", color)}>{formatMonedaEntera(monto)}</p>
    </div>
  );
}
