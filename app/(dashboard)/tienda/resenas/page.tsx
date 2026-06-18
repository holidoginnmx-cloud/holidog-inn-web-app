import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createStoreServerClient } from "@/lib/supabase/store-server";
import { ResenasManager, type ResenaItem } from "@/components/domain/tienda/ResenasManager";

export const dynamic = "force-dynamic";

async function cargar(): Promise<{ resenas: ResenaItem[]; error: boolean }> {
  try {
    const sb = createStoreServerClient();
    // Pendientes primero, luego más recientes.
    const { data: reviews } = await sb
      .from("product_reviews")
      .select("id, rating, title, body, authorName, isApproved, orderId, createdAt, productId")
      .order("isApproved", { ascending: true })
      .order("createdAt", { ascending: false });

    const ids = [...new Set((reviews ?? []).map((r) => r.productId))];
    const { data: productos } = await sb.from("products").select("id, name").in("id", ids);
    const nameById = new Map((productos ?? []).map((p) => [p.id, p.name]));

    const resenas: ResenaItem[] = (reviews ?? []).map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      authorName: r.authorName,
      isApproved: r.isApproved,
      orderId: r.orderId,
      createdAt: r.createdAt,
      productName: nameById.get(r.productId) ?? "Producto",
    }));

    return { resenas, error: false };
  } catch (e) {
    console.error("[tienda:resenas] cargar:", e);
    return { resenas: [], error: true };
  }
}

export default async function ResenasPage() {
  const { resenas, error } = await cargar();
  const pendientes = resenas.filter((r) => !r.isApproved).length;

  return (
    <div className="space-y-4 pb-24">
      <Link href="/tienda" className="text-neutral-muted inline-flex items-center gap-1 text-sm">
        <ArrowLeft className="size-4" /> Volver a la tienda
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-neutral-ink text-2xl font-semibold">Reseñas</h1>
        {pendientes > 0 && (
          <span className="bg-brand-mustard/20 text-brand-mustard rounded-full px-3 py-1 text-sm font-medium">
            {pendientes} pendiente{pendientes === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {error ? (
        <p className="bg-destructive/10 text-destructive rounded-md px-3 py-6 text-center text-sm">
          No se pudieron cargar las reseñas.
        </p>
      ) : (
        <ResenasManager resenas={resenas} />
      )}
    </div>
  );
}
