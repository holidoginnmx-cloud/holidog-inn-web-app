import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ReservacionForm, type ReservacionInitial } from "@/components/domain/ReservacionForm";
import { EliminarReservacionButton } from "@/components/domain/EliminarReservacionButton";
import { PagoBadge } from "@/components/domain/PagoBadge";
import { fechaDeTimestamp, horaDeTimestamp } from "@/lib/reservacion";
import { typeToServicio, statusToEstado } from "@/lib/labels";
import type { Enums } from "@/lib/supabase/types";
import { formatMoneda } from "@/lib/utils";
import { cargarDatosFormReservacion } from "../../data";

export const dynamic = "force-dynamic";

export default async function EditarReservacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createSupabaseServerClient();

  const { data: r, error } = await supabase
    .from("reservations")
    .select(
      "id, petId, reservationType, checkIn, checkOut, appointmentAt, totalAmount, depositAgreed, status, notes",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) console.error("[reservaciones] Error al cargar para editar:", error);
  if (!r) notFound();

  const { data: pagos } = await supabase
    .from("payments")
    .select("amount")
    .eq("reservationId", id);
  const pagado = (pagos ?? []).reduce((acc, p) => acc + (p.amount ?? 0), 0);

  const { perros, reservacionesActivas, cupo, pesoPorPerro, tallaPorPerro, tarifas } =
    await cargarDatosFormReservacion();

  const tipo = r.reservationType as Enums<"ReservationType">;
  // STAY: checkIn/checkOut. ESTETICA/GUARDERIA: appointmentAt (de un día).
  const inicioTs = tipo === "STAY" ? r.checkIn : r.appointmentAt;
  const finTs = tipo === "STAY" ? r.checkOut : null;
  const precioAcordado = r.totalAmount ?? 0;

  const initial: ReservacionInitial = {
    perroId: r.petId,
    servicio: typeToServicio(tipo),
    fecha_inicio: fechaDeTimestamp(inicioTs) ?? "",
    fecha_fin: fechaDeTimestamp(finTs) ?? "",
    hora_check_in: horaDeTimestamp(r.checkIn) ?? "",
    hora_check_out: horaDeTimestamp(r.checkOut) ?? "",
    precio_acordado: String(precioAcordado),
    anticipo_acordado: r.depositAgreed != null ? String(r.depositAgreed) : "",
    estado: statusToEstado(r.status as Enums<"ReservationStatus">),
    notas: r.notes ?? "",
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/reservaciones"
          aria-label="Volver"
          className="flex size-8 items-center justify-center rounded-md text-neutral-muted hover:bg-neutral-sand"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-ink">Editar reservación</h1>
      </div>

      {/* Resumen de pago (derivado: pagado vs precio acordado). */}
      <div className="space-y-2 rounded-xl border border-neutral-border bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-brand-teal">Resumen de pago</h2>
          <PagoBadge precioAcordado={precioAcordado} pagado={pagado} />
        </div>
        <dl className="grid grid-cols-3 gap-2 text-center">
          <div>
            <dt className="text-xs text-neutral-muted">Acordado</dt>
            <dd className="text-sm font-medium text-neutral-ink">
              {formatMoneda(precioAcordado)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-muted">Pagado</dt>
            <dd className="text-sm font-medium text-brand-ingreso">{formatMoneda(pagado)}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-muted">Saldo</dt>
            <dd className="text-sm font-medium text-neutral-ink">
              {formatMoneda(precioAcordado - pagado)}
            </dd>
          </div>
        </dl>
      </div>

      <ReservacionForm
        mode="editar"
        reservacionId={id}
        initial={initial}
        perros={perros}
        reservacionesActivas={reservacionesActivas}
        cupo={cupo}
        pesoPorPerro={pesoPorPerro}
        tallaPorPerro={tallaPorPerro}
        tarifas={tarifas}
      />

      <EliminarReservacionButton reservacionId={id} />
    </div>
  );
}
