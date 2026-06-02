import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  mesActual,
  mesAnterior,
  ultimosNMeses,
  nombreMesCorto,
  hoyISO,
  type MesAnio,
} from "@/lib/date";
import { ocupantes, type ResvLite } from "@/lib/ocupacion";
import {
  TIPO_COSTO_OPTIONS,
  type Servicio,
  type TipoCosto,
  type ReservacionEstado,
} from "@/lib/labels";
import { MesSelector } from "@/components/domain/dashboard/MesSelector";
import { AccionesRapidas } from "@/components/domain/dashboard/AccionesRapidas";
import { KpiCards } from "@/components/domain/dashboard/KpiCards";
import { GaugeOcupacion } from "@/components/domain/dashboard/GaugeOcupacion";
import { GaugeMargen } from "@/components/domain/dashboard/GaugeMargen";
import { TendenciaArea } from "@/components/domain/dashboard/TendenciaArea";
import { IngresosServicioMensualChart } from "@/components/domain/dashboard/IngresosServicioMensualChart";
import { TopPerrosTable } from "@/components/domain/dashboard/TopPerrosTable";
import { EgresosCategoriaChart } from "@/components/domain/dashboard/EgresosCategoriaChart";
import { ResumenCostos } from "@/components/domain/dashboard/ResumenCostos";
import { ReporteAnual } from "@/components/domain/dashboard/ReporteAnual";
import { SeccionColapsable } from "@/components/domain/dashboard/SeccionColapsable";

export const dynamic = "force-dynamic";

function resolverMes(sp: { anio?: string; mes?: string }): MesAnio {
  const anio = Number(sp.anio);
  const mes = Number(sp.mes);
  if (Number.isInteger(anio) && Number.isInteger(mes) && mes >= 1 && mes <= 12 && anio >= 2000) {
    return { anio, mes };
  }
  return mesActual();
}

const k = (a: number, m: number) => `${a}-${m}`;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string; mes?: string }>;
}) {
  const sp = await searchParams;
  const actual = resolverMes(sp);
  const { anio, mes } = actual;

  const supabase = createSupabaseServerClient();

  const todayISO = hoyISO();

  const [
    ingMensual,
    egrMensual,
    porServicioAnio,
    porCategoria,
    porPerro,
    cfgRes,
    resvHotelRes,
  ] = await Promise.all([
      supabase.from("vw_ingresos_mensuales").select("anio, mes_num, total_ingresos"),
      supabase.from("vw_egresos_mensuales").select("anio, mes_num, total_egresos"),
      supabase
        .from("vw_ingresos_por_servicio")
        .select("mes_num, servicio, total")
        .eq("anio", anio),
      supabase
        .from("vw_egresos_por_categoria")
        .select("mes_num, categoria, tipo_costo, total")
        .eq("anio", anio),
      supabase
        .from("vw_ingresos_por_perro")
        .select("perro_id, perro_nombre, total")
        .eq("anio", anio)
        .eq("mes_num", mes)
        .order("total", { ascending: false })
        .limit(10),
      supabase.from("config").select("cupo_maximo").eq("id", 1).maybeSingle(),
      supabase
        .from("reservaciones")
        .select("id, perro_id, servicio, fecha_inicio, fecha_fin, estado")
        .eq("servicio", "HOTEL")
        .in("estado", ["RESERVADA", "EN_CURSO"]),
    ]);

  // Ocupación de hoy (solo HOTEL). Reutiliza la lógica de disponibilidad.
  const cupo = cfgRes.data?.cupo_maximo ?? 20;
  const resvHotel: ResvLite[] = (resvHotelRes.data ?? []).map((r) => ({
    id: r.id,
    perroId: r.perro_id,
    perroNombre: null,
    servicio: r.servicio as Servicio,
    fecha_inicio: r.fecha_inicio,
    fecha_fin: r.fecha_fin,
    estado: r.estado as ReservacionEstado,
  }));
  const hospedadosHoy = ocupantes(resvHotel, todayISO).length;

  // Totales mensuales (vistas pequeñas: las traemos completas y mapeamos).
  const ingMap = new Map<string, number>();
  (ingMensual.data ?? []).forEach((r) => {
    if (r.anio != null && r.mes_num != null)
      ingMap.set(k(r.anio, r.mes_num), r.total_ingresos ?? 0);
  });
  const egrMap = new Map<string, number>();
  (egrMensual.data ?? []).forEach((r) => {
    if (r.anio != null && r.mes_num != null) egrMap.set(k(r.anio, r.mes_num), r.total_egresos ?? 0);
  });

  const ingresosMes = ingMap.get(k(anio, mes)) ?? 0;
  const egresosMes = egrMap.get(k(anio, mes)) ?? 0;
  const utilidad = ingresosMes - egresosMes;
  const prev = mesAnterior(actual);
  const ingresosPrev = ingMap.get(k(prev.anio, prev.mes)) ?? 0;
  const egresosPrev = egrMap.get(k(prev.anio, prev.mes)) ?? 0;
  const utilidadPrev = ingresosPrev - egresosPrev;
  const margen = ingresosMes > 0 ? (utilidad / ingresosMes) * 100 : 0;

  const tendencia = ultimosNMeses(actual, 6).map((mm) => {
    const ing = ingMap.get(k(mm.anio, mm.mes)) ?? 0;
    const egr = egrMap.get(k(mm.anio, mm.mes)) ?? 0;
    return {
      label: nombreMesCorto(mm.anio, mm.mes),
      ingresos: ing,
      egresos: egr,
      utilidad: ing - egr,
    };
  });

  // Egresos por categoría: agregados de TODO el año (detalle secundario).
  const catMap = new Map<string, number>();
  (porCategoria.data ?? []).forEach((r) => {
    const c = r.categoria ?? "Sin categoría";
    catMap.set(c, (catMap.get(c) ?? 0) + (r.total ?? 0));
  });
  const totalEgresosAnio = [...catMap.values()].reduce((s, n) => s + n, 0);
  const categoria = [...catMap.entries()]
    .map(([categoria, total]) => ({
      categoria,
      total,
      pct: totalEgresosAnio > 0 ? (total / totalEgresosAnio) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Egresos por tipo de costo, por mes (base del Resumen de costos estilo Excel).
  const tipoPorMes = new Map<number, Map<TipoCosto, number>>();
  (porCategoria.data ?? []).forEach((r) => {
    if (r.mes_num == null || !r.tipo_costo) return;
    const m = tipoPorMes.get(r.mes_num) ?? new Map<TipoCosto, number>();
    m.set(r.tipo_costo, (m.get(r.tipo_costo) ?? 0) + (r.total ?? 0));
    tipoPorMes.set(r.mes_num, m);
  });

  const topPerros = (porPerro.data ?? []).map((r) => ({
    perroId: r.perro_id,
    nombre: r.perro_nombre ?? "—",
    total: r.total ?? 0,
  }));

  // Reporte anual (estilo Excel): ingresos por servicio de cada mes del año
  // seleccionado + egresos mensuales (de egrMap). Solo meses con datos.
  const servPorMes = new Map<number, { hotel: number; estetica: number; guarderia: number }>();
  (porServicioAnio.data ?? []).forEach((r) => {
    if (r.mes_num == null || !r.servicio) return;
    const acc = servPorMes.get(r.mes_num) ?? { hotel: 0, estetica: 0, guarderia: 0 };
    const monto = r.total ?? 0;
    if (r.servicio === "HOTEL") acc.hotel += monto;
    else if (r.servicio === "ESTETICA") acc.estetica += monto;
    else if (r.servicio === "GUARDERIA") acc.guarderia += monto;
    servPorMes.set(r.mes_num, acc);
  });

  const { anio: anioHoy, mes: mesHoy } = mesActual();
  const mesesConDatos: number[] = [];
  const reporteAnual = {
    anio,
    meses: [] as string[],
    hotel: [] as number[],
    estetica: [] as number[],
    guarderia: [] as number[],
    egresos: [] as number[],
    enCurso: [] as boolean[],
  };
  for (let m = 1; m <= 12; m++) {
    const serv = servPorMes.get(m) ?? { hotel: 0, estetica: 0, guarderia: 0 };
    const egr = egrMap.get(k(anio, m)) ?? 0;
    const tieneDatos = serv.hotel + serv.estetica + serv.guarderia > 0 || egr > 0;
    if (!tieneDatos) continue;
    mesesConDatos.push(m);
    reporteAnual.meses.push(nombreMesCorto(anio, m));
    reporteAnual.hotel.push(serv.hotel);
    reporteAnual.estetica.push(serv.estetica);
    reporteAnual.guarderia.push(serv.guarderia);
    reporteAnual.egresos.push(egr);
    reporteAnual.enCurso.push(anio === anioHoy && m === mesHoy);
  }

  // Serie mensual para la gráfica de tendencia (líneas) por servicio.
  const serviciosMensual = reporteAnual.meses.map((label, i) => ({
    label,
    HOTEL: reporteAnual.hotel[i] ?? 0,
    ESTETICA: reporteAnual.estetica[i] ?? 0,
    GUARDERIA: reporteAnual.guarderia[i] ?? 0,
    enCurso: reporteAnual.enCurso[i] ?? false,
  }));

  // Resumen de costos estilo Excel: % de cada tipo de costo sobre los ingresos
  // de cada mes + % de utilidad. Reusa los meses con datos del reporte anual.
  const resumenCostos = {
    anio,
    meses: reporteAnual.meses,
    ingresos: reporteAnual.meses.map(
      (_, i) =>
        (reporteAnual.hotel[i] ?? 0) +
        (reporteAnual.estetica[i] ?? 0) +
        (reporteAnual.guarderia[i] ?? 0),
    ),
    egresos: reporteAnual.egresos,
    enCurso: reporteAnual.enCurso,
    porTipo: Object.fromEntries(
      TIPO_COSTO_OPTIONS.map((t) => [
        t,
        reporteAnual.meses.map((_, i) => {
          // El mes en el índice i corresponde al número de mes m con datos.
          const m = mesesConDatos[i] ?? 0;
          return tipoPorMes.get(m)?.get(t) ?? 0;
        }),
      ]),
    ) as Record<TipoCosto, number[]>,
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-neutral-ink">Resumen</h1>

      <AccionesRapidas />

      <MesSelector actual={actual} />

      {/* Indicadores principales: gauges + KPIs con delta vs. mes anterior. */}
      <div className="grid grid-cols-2 gap-3">
        <GaugeOcupacion valor={hospedadosHoy} cupo={cupo} />
        <GaugeMargen margen={margen} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCards
          ingresos={ingresosMes}
          egresos={egresosMes}
          utilidad={utilidad}
          ingresosPrev={ingresosPrev}
          egresosPrev={egresosPrev}
          utilidadPrev={utilidadPrev}
        />
      </div>

      {/* Cuadrícula de widgets siempre visibles. */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TendenciaArea data={tendencia} />
        </div>
        <div className="lg:col-span-1">
          <TopPerrosTable perros={topPerros} />
        </div>

        <div className="rounded-xl border border-neutral-border bg-white p-4 lg:col-span-3">
          <p className="text-sm font-medium text-neutral-ink">Resumen de costos</p>
          <p className="mb-3 text-xs text-neutral-muted">{`% sobre ingresos por mes · ${anio}`}</p>
          <ResumenCostos data={resumenCostos} />

          {/* Egresos por categoría: detalle secundario (menos relevante), colapsado. */}
          <SeccionColapsable title={`Egresos por categoría · ${anio}`}>
            <EgresosCategoriaChart data={categoria} />
          </SeccionColapsable>
        </div>

        <div className="rounded-xl border border-neutral-border bg-white p-4 lg:col-span-3">
          <p className="mb-3 text-sm font-medium text-neutral-ink">{`Reporte anual ${anio}`}</p>
          <ReporteAnual data={reporteAnual} />

          {/* Ingresos por servicio: misma data del reporte, vista de tendencia, colapsada. */}
          <SeccionColapsable title={`Ingresos por servicio · ${anio}`}>
            <IngresosServicioMensualChart data={serviciosMensual} />
          </SeccionColapsable>
        </div>
      </div>
    </div>
  );
}
