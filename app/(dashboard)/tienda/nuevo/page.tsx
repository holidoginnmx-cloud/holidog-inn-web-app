import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createStoreServerClient } from "@/lib/supabase/store-server";
import { ProductoNuevoForm } from "@/components/domain/tienda/ProductoNuevoForm";

export const dynamic = "force-dynamic";

export default async function NuevoProductoPage() {
  let categorias: { id: string; name: string }[] = [];
  try {
    const sb = createStoreServerClient();
    const { data } = await sb
      .from("product_categories")
      .select("id, name")
      .eq("isActive", true)
      .order("sortOrder");
    categorias = data ?? [];
  } catch (e) {
    console.error("[tienda/nuevo] categorias:", e);
  }

  return (
    <div className="space-y-5 pb-24">
      <Link href="/tienda" className="text-neutral-muted inline-flex items-center gap-1 text-sm">
        <ArrowLeft className="size-4" /> Volver a la tienda
      </Link>
      <h1 className="text-neutral-ink text-2xl font-semibold">Nuevo producto</h1>
      <ProductoNuevoForm categorias={categorias} />
    </div>
  );
}
