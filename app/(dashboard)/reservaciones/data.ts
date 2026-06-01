import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Servicio, ReservacionEstado } from "@/lib/labels";
import type { ResvLite } from "@/lib/ocupacion";
import type { ComboOption } from "@/components/domain/Combobox";
import { MARCA_REVISAR_PERRO } from "@/lib/perro";

function one<T>(x: T | T[] | null | undefined): T | null {
  if (x == null) return null;
  return Array.isArray(x) ? (x[0] ?? null) : x;
}

// Datos compartidos por los formularios de reservación (crear / editar):
// catálogo de perros, reservaciones HOTEL activas (para el warning de cupo) y cupo.
export async function cargarDatosFormReservacion(): Promise<{
  perros: ComboOption[];
  reservacionesActivas: ResvLite[];
  cupo: number;
}> {
  const supabase = createSupabaseServerClient();

  const [cfgRes, perrosRes, resvRes] = await Promise.all([
    supabase.from("config").select("cupo_maximo").eq("id", 1).maybeSingle(),
    supabase
      .from("perros")
      .select("id, nombre, notas, cliente:clientes(nombre)")
      .order("nombre"),
    supabase
      .from("reservaciones")
      .select("id, perro_id, servicio, fecha_inicio, fecha_fin, estado, perro:perros(nombre)")
      .eq("servicio", "HOTEL")
      .in("estado", ["RESERVADA", "EN_CURSO"]),
  ]);

  const perros: ComboOption[] = (perrosRes.data ?? [])
    // Ocultamos los placeholders "REVISAR": no se debe agendar bajo un registro basura.
    .filter((p) => p.notas !== MARCA_REVISAR_PERRO)
    .map((p) => ({
      value: p.id,
      label: p.nombre,
      sublabel: (one(p.cliente) as { nombre: string } | null)?.nombre,
    }));

  const reservacionesActivas: ResvLite[] = (resvRes.data ?? []).map((r) => ({
    id: r.id,
    perroId: r.perro_id,
    perroNombre: (one(r.perro) as { nombre: string } | null)?.nombre ?? null,
    servicio: r.servicio as Servicio,
    fecha_inicio: r.fecha_inicio,
    fecha_fin: r.fecha_fin,
    estado: r.estado as ReservacionEstado,
  }));

  return { perros, reservacionesActivas, cupo: cfgRes.data?.cupo_maximo ?? 20 };
}
