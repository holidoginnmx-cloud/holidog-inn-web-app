import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ReservacionForm, type ReservacionInitial } from "@/components/domain/ReservacionForm";
import { EliminarReservacionButton } from "@/components/domain/EliminarReservacionButton";
import { PagoBadge } from "@/components/domain/PagoBadge";
import { sumarPagos } from "@/lib/reservacion";
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
    .from("reservaciones")
    .select(
      "id, perro_id, servicio, fecha_inicio, fecha_fin, hora_check_in, hora_check_out, precio_acordado, anticipo_acordado, estado, notas",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) console.error("[reservaciones] Error al cargar para editar:", error);
  if (!r) notFound();

  const { data: pagos } = await supabase.from("pagos").select("monto").eq("reservacion_id", id);
  const pagado = sumarPagos(pagos);

  const { perros, reservacionesActivas, cupo, pesoPorPerro, tallaPorPerro, tarifas } =
    await cargarDatosFormReservacion();

  const initial: ReservacionInitial = {
    perroId: r.perro_id,
    servicio: r.servicio,
    fecha_inicio: r.fecha_inicio,
    fecha_fin: r.fecha_fin ?? "",
    hora_check_in: r.hora_check_in?.slice(0, 5) ?? "",
    hora_check_out: r.hora_check_out?.slice(0, 5) ?? "",
    precio_acordado: r.precio_acordado != null ? String(r.precio_acordado) : "",
    anticipo_acordado: r.anticipo_acordado != null ? String(r.anticipo_acordado) : "",
    estado: r.estado,
    notas: r.notas ?? "",
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
          <PagoBadge precioAcordado={r.precio_acordado} pagado={pagado} />
        </div>
        <dl className="grid grid-cols-3 gap-2 text-center">
          <div>
            <dt className="text-xs text-neutral-muted">Acordado</dt>
            <dd className="text-sm font-medium text-neutral-ink">
              {formatMoneda(r.precio_acordado)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-muted">Pagado</dt>
            <dd className="text-sm font-medium text-brand-ingreso">{formatMoneda(pagado)}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-muted">Saldo</dt>
            <dd className="text-sm font-medium text-neutral-ink">
              {formatMoneda(r.precio_acordado - pagado)}
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
