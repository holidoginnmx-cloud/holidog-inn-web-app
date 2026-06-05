import Link from "next/link";
import { Plus } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn, focusRing } from "@/lib/utils";
import { hoyISO } from "@/lib/date";
import type { Servicio, ReservacionEstado } from "@/lib/labels";
import type { ResvLite } from "@/lib/ocupacion";
import { sumarPagos } from "@/lib/reservacion";
import { ReservacionesScreen } from "@/components/domain/ReservacionesScreen";

export const dynamic = "force-dynamic";

function one<T>(x: T | T[] | null | undefined): T | null {
  if (x == null) return null;
  return Array.isArray(x) ? (x[0] ?? null) : x;
}

export default async function ReservacionesPage() {
  const supabase = createSupabaseServerClient();

  const [cfgRes, resvRes] = await Promise.all([
    supabase.from("config").select("cupo_maximo").eq("id", 1).maybeSingle(),
    supabase
      .from("reservaciones")
      .select(
        "id, perro_id, servicio, fecha_inicio, fecha_fin, hora_check_in, hora_check_out, estado, precio_acordado, perro:perros(nombre), pagos(monto)",
      )
      // Incluye FINALIZADA (históricas migradas del Excel); excluye CANCELADA.
      .in("estado", ["RESERVADA", "EN_CURSO", "FINALIZADA"])
      .order("fecha_inicio", { ascending: true }),
  ]);

  const cupo = cfgRes.data?.cupo_maximo ?? 20;
  const reservaciones: ResvLite[] = (resvRes.data ?? []).map((r) => ({
    id: r.id,
    perroId: r.perro_id,
    perroNombre: (one(r.perro) as { nombre: string } | null)?.nombre ?? null,
    servicio: r.servicio as Servicio,
    fecha_inicio: r.fecha_inicio,
    fecha_fin: r.fecha_fin,
    estado: r.estado as ReservacionEstado,
    precioAcordado: r.precio_acordado ?? 0,
    pagado: sumarPagos(r.pagos),
    horaCheckIn: r.hora_check_in,
    horaCheckOut: r.hora_check_out,
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-neutral-ink">Reservaciones</h1>

      <ReservacionesScreen reservaciones={reservaciones} cupo={cupo} todayISO={hoyISO()} />

      <Link
        href="/reservaciones/nueva"
        aria-label="Nueva reservación"
        className={cn(
          "fixed bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] right-4 z-30 flex size-14 items-center justify-center rounded-full bg-brand-teal text-white shadow-lg transition-transform active:scale-95",
          focusRing,
        )}
      >
        <Plus className="size-6" aria-hidden />
      </Link>
    </div>
  );
}
