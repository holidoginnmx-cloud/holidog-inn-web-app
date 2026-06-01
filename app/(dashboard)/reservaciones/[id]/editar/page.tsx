import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ReservacionForm, type ReservacionInitial } from "@/components/domain/ReservacionForm";
import { EliminarReservacionButton } from "@/components/domain/EliminarReservacionButton";
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
      "id, perro_id, servicio, fecha_inicio, fecha_fin, precio_acordado, anticipo_acordado, estado, notas",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) console.error("[reservaciones] Error al cargar para editar:", error);
  if (!r) notFound();

  const { perros, reservacionesActivas, cupo, pesoPorPerro, tallaPorPerro, tarifas } =
    await cargarDatosFormReservacion();

  const initial: ReservacionInitial = {
    perroId: r.perro_id,
    servicio: r.servicio,
    fecha_inicio: r.fecha_inicio,
    fecha_fin: r.fecha_fin ?? "",
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
