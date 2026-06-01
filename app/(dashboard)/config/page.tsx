import Link from "next/link";
import { Download, Upload, ExternalLink, Handshake } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ConfigForm } from "@/components/domain/ConfigForm";
import { TarifasForm, type TarifaItem } from "@/components/domain/TarifasForm";
import { CategoriasEditor, type CategoriaUso } from "@/components/domain/CategoriasEditor";
import { CollapsibleBlock } from "@/components/domain/dashboard/CollapsibleBlock";
import pkg from "@/package.json";

export const dynamic = "force-dynamic";

function Seccion({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-neutral-muted">{title}</h2>
      {children}
    </section>
  );
}

export default async function ConfigPage() {
  const supabase = createSupabaseServerClient();

  const [cfgRes, egresosRes, tarifasRes] = await Promise.all([
    supabase.from("config").select("nombre_hotel, cupo_maximo").eq("id", 1).maybeSingle(),
    supabase.from("egresos").select("categoria"),
    supabase.from("tarifas").select("codigo, servicio, etiqueta, precio").order("orden"),
  ]);

  const nombre = cfgRes.data?.nombre_hotel ?? "Holidog Inn";
  const cupo = cfgRes.data?.cupo_maximo ?? 20;

  const conteo = new Map<string, number>();
  (egresosRes.data ?? []).forEach((e) => {
    if (e.categoria) conteo.set(e.categoria, (conteo.get(e.categoria) ?? 0) + 1);
  });
  const categorias: CategoriaUso[] = [...conteo.entries()]
    .map(([nombre, usos]) => ({ nombre, usos }))
    .sort((a, b) => b.usos - a.usos);

  const tarifas: TarifaItem[] = (tarifasRes.data ?? []).map((t) => ({
    codigo: t.codigo,
    servicio: t.servicio,
    etiqueta: t.etiqueta,
    precio: Number(t.precio),
  }));

  const repoUrl = process.env.NEXT_PUBLIC_REPO_URL;

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-ink">Configuración</h1>

      <Seccion title="Hotel">
        <ConfigForm nombre={nombre} cupo={cupo} />
      </Seccion>

      {tarifas.length > 0 && (
        <CollapsibleBlock title="Tarifas" defaultOpen={false}>
          <TarifasForm tarifas={tarifas} />
        </CollapsibleBlock>
      )}

      <CollapsibleBlock
        title={`Categorías de egresos (${categorias.length})`}
        defaultOpen={false}
      >
        <CategoriasEditor categorias={categorias} />
      </CollapsibleBlock>

      <Seccion title="Patrocinios">
        <Button asChild variant="outline" className="w-full justify-start">
          <Link href="/config/patrocinios">
            <Handshake className="size-4" aria-hidden />
            Gestionar patrocinadores
          </Link>
        </Button>
      </Seccion>

      <Seccion title="Datos">
        <div className="flex flex-col gap-3">
          <Button asChild>
            <a href="/api/export" download>
              <Download className="size-4" aria-hidden />
              Exportar todo a Excel
            </a>
          </Button>
          <Button asChild variant="outline">
            <Link href="/config/migrar">
              <Upload className="size-4" aria-hidden />
              Importar desde Excel
            </Link>
          </Button>
        </div>
      </Seccion>

      <Seccion title="Acerca de">
        <div className="space-y-2 rounded-xl border border-neutral-border bg-white p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-neutral-muted">Versión</span>
            <span className="font-medium text-neutral-ink">v{pkg.version}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-muted">Repositorio</span>
            {repoUrl ? (
              <a
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 font-medium text-brand-teal"
              >
                <ExternalLink className="size-4" aria-hidden />
                Ver código
              </a>
            ) : (
              <span className="text-neutral-muted">No configurado</span>
            )}
          </div>
        </div>
      </Seccion>
    </div>
  );
}
