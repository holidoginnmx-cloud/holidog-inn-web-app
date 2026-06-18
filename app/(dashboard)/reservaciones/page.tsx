import Link from "next/link";
import { Plus } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn, focusRing } from "@/lib/utils";
import { hoyISO } from "@/lib/date";
import { typeToServicio, statusToEstado } from "@/lib/labels";
import type { Enums } from "@/lib/supabase/types";
import type { ResvLite } from "@/lib/ocupacion";
import { fechaDeTimestamp } from "@/lib/reservacion";
import { derivarEstetica, RESV_ADDON_SELECT } from "@/lib/estetica";
import { ReservacionesScreen } from "@/components/domain/ReservacionesScreen";

export const dynamic = "force-dynamic";

function one<T>(x: T | T[] | null | undefined): T | null {
  if (x == null) return null;
  return Array.isArray(x) ? (x[0] ?? null) : x;
}

function sumarPagosEn(pagos: { amount: number | null }[] | null | undefined): number {
  return (pagos ?? []).reduce((acc, p) => acc + (p.amount ?? 0), 0);
}

export default async function ReservacionesPage() {
  const supabase = createSupabaseServerClient();

  const [cfgRes, resvRes] = await Promise.all([
    supabase
      .from("hotel_config")
      .select("cupo_maximo:maxCapacity")
      .eq("id", "singleton")
      .maybeSingle(),
    supabase
      .from("reservations")
      .select(
        `id, petId, reservationType, checkIn, checkOut, appointmentAt, status, totalAmount, pet:pets(nombre:name), payments(amount), ${RESV_ADDON_SELECT}`,
      )
      // Incluye CHECKED_OUT (históricas migradas del Excel); excluye CANCELLED.
      .in("status", ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"])
      .order("checkIn", { ascending: true }),
  ]);

  const cupo = cfgRes.data?.cupo_maximo ?? 20;
  const reservaciones: ResvLite[] = (resvRes.data ?? []).map((r) => {
    const tipo = r.reservationType as Enums<"ReservationType">;
    // STAY: checkIn/checkOut. ESTETICA/GUARDERIA: appointmentAt (de un día).
    const inicioTs = tipo === "STAY" ? r.checkIn : r.appointmentAt;
    const finTs = tipo === "STAY" ? r.checkOut : null;
    return {
      id: r.id,
      perroId: r.petId,
      perroNombre: (one(r.pet) as { nombre: string } | null)?.nombre ?? null,
      servicio: typeToServicio(tipo),
      fecha_inicio: fechaDeTimestamp(inicioTs) ?? "",
      fecha_fin: fechaDeTimestamp(finTs),
      estado: statusToEstado(r.status as Enums<"ReservationStatus">),
      precioAcordado: r.totalAmount ?? 0,
      pagado: sumarPagosEn(r.payments),
      ...derivarEstetica(tipo, r.reservation_addons),
    };
  });

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
