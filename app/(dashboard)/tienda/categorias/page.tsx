import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createStoreServerClient } from "@/lib/supabase/store-server";
import { CategoriasManager, type CategoriaItem } from "@/components/domain/tienda/CategoriasManager";

export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  let categorias: CategoriaItem[] = [];
  try {
    const sb = createStoreServerClient();
    const [{ data: cats }, { data: productos }] = await Promise.all([
      sb.from("product_categories").select("id, name, description, sortOrder, isActive").order("sortOrder"),
      sb.from("products").select("categoryId"),
    ]);
    const conteo = new Map<string, number>();
    for (const p of productos ?? []) {
      if (p.categoryId) conteo.set(p.categoryId, (conteo.get(p.categoryId) ?? 0) + 1);
    }
    categorias = (cats ?? []).map((c) => ({ ...c, productos: conteo.get(c.id) ?? 0 }));
  } catch (e) {
    console.error("[tienda/categorias]", e);
  }

  return (
    <div className="space-y-5 pb-24">
      <Link href="/tienda" className="text-neutral-muted inline-flex items-center gap-1 text-sm">
        <ArrowLeft className="size-4" /> Volver a la tienda
      </Link>
      <h1 className="text-neutral-ink text-2xl font-semibold">Categorías</h1>
      <CategoriasManager categorias={categorias} />
    </div>
  );
}
