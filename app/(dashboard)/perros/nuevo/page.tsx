import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PerroForm } from "@/components/domain/PerroForm";
import { obtenerCatalogoVacunas } from "../data";

export default async function NuevoPerroPage() {
  const catalogoVacunas = await obtenerCatalogoVacunas();

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/perros"
          aria-label="Volver"
          className="flex size-8 items-center justify-center rounded-md text-neutral-muted hover:bg-neutral-sand"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-ink">Nuevo perro</h1>
      </div>

      <PerroForm mode="crear" catalogoVacunas={catalogoVacunas} />
    </div>
  );
}
