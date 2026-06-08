import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mesActual, mesSiguiente, etiquetaMesAnio, type MesAnio } from "@/lib/date";
import {
  CATEGORIAS_CONOCIDAS,
  type Servicio,
  type PagoTipo,
  type TipoCosto,
  type MetodoPago,
  typeToServicio,
} from "@/lib/labels";
import {
  MovimientosHub,
  type IngresoItem,
  type EgresoItem,
} from "@/components/domain/MovimientosHub";
import { MesSelector } from "@/components/domain/dashboard/MesSelector";
import type { ComboOption } from "@/components/domain/Combobox";

export const dynamic = "force-dynamic";

// Normaliza un embed que puede venir como objeto o arreglo de un elemento.
function one<T>(x: T | T[] | null | undefined): T | null {
  if (x == null) return null;
  return Array.isArray(x) ? (x[0] ?? null) : x;
}

function resolverMes(sp: { anio?: string; mes?: string }): MesAnio {
  const anio = Number(sp.anio);
  const mes = Number(sp.mes);
  if (Number.isInteger(anio) && Number.isInteger(mes) && mes >= 1 && mes <= 12 && anio >= 2000) {
    return { anio, mes };
  }
  return mesActual();
}

const primerDia = ({ anio, mes }: MesAnio) => `${anio}-${String(mes).padStart(2, "0")}-01`;

export default async function MovimientosPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string; mes?: string }>;
}) {
  const supabase = createSupabaseServerClient();

  const actual = resolverMes(await searchParams);
  const { anio, mes } = actual;
  const mesLabel = etiquetaMesAnio(anio, mes);

  // Rango [primer día del mes, primer día del mes siguiente).
  const desde = primerDia(actual);
  const hasta = primerDia(mesSiguiente(actual));

  const [pagosRes, egresosRes, ingMesRes, egrMesRes, perrosRes, catsRes] = await Promise.all([
    supabase
      .from("payments")
      .select(
        "id, monto:amount, tipo:kind, fecha:paidAt, metodo_pago:method, descripcion:notes, reservacion_id:reservationId",
      )
      .gte("paidAt", desde)
      .lt("paidAt", hasta)
      .order("paidAt", { ascending: false })
      .limit(200),
    supabase
      .from("expenses")
      .select(
        "id, fecha:date, descripcion:description, monto:amount, categoria:category, tipo_costo:costType, notas:notes",
      )
      .gte("date", desde)
      .lt("date", hasta)
      .order("date", { ascending: false })
      .limit(200),
    supabase
      .from("vw_ingresos_mensuales")
      .select("total_ingresos")
      .eq("anio", anio)
      .eq("mes_num", mes)
      .maybeSingle(),
    supabase
      .from("vw_egresos_mensuales")
      .select("total_egresos")
      .eq("anio", anio)
      .eq("mes_num", mes)
      .maybeSingle(),
    supabase
      .from("pets")
      .select("id, nombre:name, cliente:users!pets_ownerId_fkey(nombre:firstName)")
      .order("name"),
    supabase.from("expenses").select("categoria:category"),
  ]);

  // Servicio y nombre del perro de cada pago: se resuelven por reservationId
  // contra la tabla unificada `reservations` (+ pets) en una consulta aparte.
  const reservacionIds = Array.from(
    new Set((pagosRes.data ?? []).map((p) => p.reservacion_id).filter(Boolean)),
  );
  const resvMap = new Map<string, { servicio: Servicio; perroNombre: string | null }>();
  if (reservacionIds.length > 0) {
    const { data: resvData } = await supabase
      .from("reservations")
      .select("id, reservationType, pet:pets(nombre:name)")
      .in("id", reservacionIds);
    for (const r of resvData ?? []) {
      const perro = one(r.pet) as { nombre: string } | null;
      resvMap.set(r.id, {
        servicio: typeToServicio(r.reservationType),
        perroNombre: perro?.nombre ?? null,
      });
    }
  }

  const ingresos: IngresoItem[] = (pagosRes.data ?? []).map((p) => {
    const resv = p.reservacion_id ? resvMap.get(p.reservacion_id) : undefined;
    return {
      id: p.id,
      monto: p.monto,
      tipo: p.tipo as PagoTipo,
      metodoPago: p.metodo_pago as MetodoPago,
      fecha: p.fecha ?? "",
      servicio: resv?.servicio ?? null,
      perroNombre: resv?.perroNombre ?? null,
      descripcion: p.descripcion ?? null,
    };
  });

  const egresos: EgresoItem[] = (egresosRes.data ?? []).map((e) => ({
    id: e.id,
    fecha: e.fecha,
    descripcion: e.descripcion,
    monto: e.monto,
    categoria: e.categoria,
    tipo_costo: e.tipo_costo as TipoCosto,
    notas: e.notas ?? null,
  }));

  const perros: ComboOption[] = (perrosRes.data ?? []).map((p) => {
    const cli = one(p.cliente) as { nombre: string } | null;
    return { value: p.id, label: p.nombre, sublabel: cli?.nombre };
  });

  // Categorías: conocidas (CLAUDE.md) + distintas reales de la BD, ordenadas.
  const categorias = Array.from(
    new Set<string>([
      ...CATEGORIAS_CONOCIDAS,
      ...(catsRes.data ?? []).map((r) => r.categoria).filter(Boolean),
    ]),
  ).sort((a, b) => a.localeCompare(b, "es"));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-neutral-ink">Movimientos</h1>
      <MesSelector actual={actual} basePath="/movimientos" />
      <MovimientosHub
        ingresos={ingresos}
        egresos={egresos}
        totalIngresosMes={ingMesRes.data?.total_ingresos ?? 0}
        totalEgresosMes={egrMesRes.data?.total_egresos ?? 0}
        mesLabel={mesLabel}
        anio={anio}
        mes={mes}
        perros={perros}
        categorias={categorias}
      />
    </div>
  );
}
