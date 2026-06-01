import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PatrociniosManager, type PatrocinioRow } from "@/components/domain/PatrociniosManager";

export const dynamic = "force-dynamic";

export default async function PatrociniosPage() {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("patrocinios")
    .select("id, nombre, patrocina_bano, patrocina_corral")
    .order("nombre");

  if (error) console.error("[patrocinios] listar:", error);

  const patrocinios: PatrocinioRow[] = data ?? [];

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      <div className="flex items-center gap-2">
        <Link
          href="/config"
          aria-label="Volver"
          className="flex size-8 items-center justify-center rounded-md text-neutral-muted hover:bg-neutral-sand"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-ink">Patrocinios</h1>
      </div>

      <p className="text-sm text-neutral-muted">
        Patrocinadores del hotel. Marca si cada uno patrocina el <strong>baño</strong> y/o el{" "}
        <strong>corral</strong>. Los cambios se guardan al instante.
      </p>

      <PatrociniosManager inicial={patrocinios} />
    </div>
  );
}
