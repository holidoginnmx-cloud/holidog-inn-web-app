import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ReservacionForm } from "@/components/domain/ReservacionForm";
import { cargarDatosFormReservacion } from "../data";

export const dynamic = "force-dynamic";

export default async function NuevaReservacionPage({
  searchParams,
}: {
  searchParams: Promise<{ perro?: string }>;
}) {
  const { perro } = await searchParams;
  const { perros, reservacionesActivas, cupo } = await cargarDatosFormReservacion();

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
        <h1 className="text-2xl font-semibold text-neutral-ink">Nueva reservación</h1>
      </div>

      <ReservacionForm
        mode="crear"
        perros={perros}
        reservacionesActivas={reservacionesActivas}
        cupo={cupo}
        initialPerroId={perro}
      />
    </div>
  );
}
