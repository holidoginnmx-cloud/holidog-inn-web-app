import { cn, formatMonedaEntera, formatPorcentaje } from "@/lib/utils";
import { TIPO_COSTO_LABEL, type TipoCosto } from "@/lib/labels";
import { CELDA, COLOR_ESTADO_EGRESO, UMBRAL_MARGEN_MIN, esAlertaTipoCosto } from "@/lib/chart";

// Resumen de costos estilo Excel (hoja "RESUMEN COSTOS"): un renglón por mes y
// columnas con el % de cada tipo de costo SOBRE LOS INGRESOS del mes, el % de
// utilidad y la utilidad en pesos. Celdas verdes dentro de rango, rojas fuera
// (mismos umbrales que el resto del dashboard, ver lib/chart.ts).
// Server Component: solo presentación tabular.

export type ResumenCostosData = {
  anio: number;
  meses: string[]; // etiquetas de renglón, p. ej. ["ene", "feb", …]
  ingresos: number[];
  egresos: number[];
  porTipo: Record<TipoCosto, number[]>;
  enCurso: boolean[]; // mes en curso (datos parciales)
};

// Orden de columnas igual al Excel del cliente.
const COLUMNAS: TipoCosto[] = ["VARIABLE", "FIJO", "SUELDO", "MARKETING", "REINVERSION"];

export function ResumenCostos({ data }: { data: ResumenCostosData }) {
  const { meses, ingresos, egresos, porTipo, enCurso } = data;

  if (meses.length === 0) {
    return <p className="py-6 text-center text-sm text-neutral-muted">Sin movimientos este año.</p>;
  }

  const hayEnCurso = enCurso.some(Boolean);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs tabular-nums">
          <thead>
            <tr className="border-b border-neutral-border">
              <th className="sticky left-0 z-10 bg-white py-2 pr-3 pl-0 text-left font-medium text-neutral-muted">
                Mes
              </th>
              {COLUMNAS.map((t) => (
                <th key={t} className="px-2 py-2 text-right font-medium text-neutral-muted">
                  {TIPO_COSTO_LABEL[t]}
                </th>
              ))}
              <th className="px-2 py-2 text-right font-medium text-neutral-muted">Utilidad</th>
              <th className="px-2 py-2 text-right font-semibold text-neutral-ink">Utilidad $</th>
            </tr>
          </thead>
          <tbody>
            {meses.map((m, i) => {
              const ing = ingresos[i] ?? 0;
              const egr = egresos[i] ?? 0;
              const util = ing - egr;
              const tieneIngresos = ing > 0;
              const utilPct = tieneIngresos ? (util / ing) * 100 : null;
              const utilAlerta = utilPct != null && utilPct < UMBRAL_MARGEN_MIN;
              return (
                <tr key={m} className="border-b border-neutral-border/60">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 whitespace-nowrap bg-white py-1.5 pr-3 text-left font-medium capitalize text-neutral-ink"
                  >
                    {m}
                    {enCurso[i] ? " *" : ""}
                  </th>
                  {COLUMNAS.map((t) => {
                    if (!tieneIngresos) {
                      return (
                        <td
                          key={t}
                          className="whitespace-nowrap px-2 py-1.5 text-right text-neutral-muted"
                        >
                          —
                        </td>
                      );
                    }
                    const pct = ((porTipo[t]?.[i] ?? 0) / ing) * 100;
                    const alerta = esAlertaTipoCosto(t, pct);
                    return (
                      <td
                        key={t}
                        className={cn(
                          "whitespace-nowrap px-2 py-1.5 text-right",
                          alerta ? CELDA.alertaBold : CELDA.ok,
                        )}
                      >
                        {formatPorcentaje(pct / 100)}
                      </td>
                    );
                  })}
                  <td
                    className={cn(
                      "whitespace-nowrap px-2 py-1.5 text-right",
                      utilPct == null
                        ? "text-neutral-muted"
                        : utilAlerta
                          ? CELDA.alertaBold
                          : CELDA.ok,
                    )}
                  >
                    {utilPct == null ? "—" : formatPorcentaje(utilPct / 100)}
                  </td>
                  <td
                    className={cn(
                      "whitespace-nowrap px-2 py-1.5 text-right font-semibold",
                      util < 0 ? "text-brand-egreso" : "text-neutral-ink",
                    )}
                  >
                    {formatMonedaEntera(util)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Leyenda de estados + nota del mes en curso. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-muted">
        <span className="flex items-center gap-1.5">
          <span
            className="size-3 rounded-sm"
            style={{ backgroundColor: COLOR_ESTADO_EGRESO.ok }}
            aria-hidden
          />
          Dentro de rango
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="size-3 rounded-sm"
            style={{ backgroundColor: COLOR_ESTADO_EGRESO.alerta }}
            aria-hidden
          />
          Fuera de rango (alerta)
        </span>
        {hayEnCurso && <span>* mes en curso (parcial)</span>}
      </div>
    </div>
  );
}
