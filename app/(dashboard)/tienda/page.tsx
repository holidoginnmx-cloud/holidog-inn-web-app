import Link from "next/link";
import { Plus, Package, ClipboardList, Tag, FolderTree } from "lucide-react";
import { createStoreServerClient } from "@/lib/supabase/store-server";
import { formatMoneda } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

type Fila = {
  id: string;
  name: string;
  categoria: string | null;
  activo: boolean;
  precioMin: number | null;
  precioMax: number | null;
  variantes: number;
  stock: number;
};

async function cargar(): Promise<{ filas: Fila[]; error: boolean }> {
  try {
    const sb = createStoreServerClient();
    const [{ data: productos }, { data: categorias }, { data: variantes }, { data: inventario }] =
      await Promise.all([
        sb.from("products").select("id, name, categoryId, isActive").order("name"),
        sb.from("product_categories").select("id, name"),
        sb.from("product_variants").select("id, productId, price"),
        sb.from("inventory").select("variantId, quantity"),
      ]);

    const catName = new Map((categorias ?? []).map((c) => [c.id, c.name]));
    const stockByVariant = new Map((inventario ?? []).map((i) => [i.variantId, i.quantity]));

    const varsByProduct = new Map<string, { price: number; stock: number }[]>();
    for (const v of variantes ?? []) {
      const arr = varsByProduct.get(v.productId) ?? [];
      arr.push({ price: Number(v.price), stock: stockByVariant.get(v.id) ?? 0 });
      varsByProduct.set(v.productId, arr);
    }

    const filas: Fila[] = (productos ?? []).map((p) => {
      const vs = varsByProduct.get(p.id) ?? [];
      const precios = vs.map((x) => x.price);
      return {
        id: p.id,
        name: p.name,
        categoria: p.categoryId ? (catName.get(p.categoryId) ?? null) : null,
        activo: p.isActive,
        precioMin: precios.length ? Math.min(...precios) : null,
        precioMax: precios.length ? Math.max(...precios) : null,
        variantes: vs.length,
        stock: vs.reduce((n, x) => n + x.stock, 0),
      };
    });

    return { filas, error: false };
  } catch (e) {
    console.error("[tienda] cargar:", e);
    return { filas: [], error: true };
  }
}

export default async function TiendaPage() {
  const { filas, error } = await cargar();

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-neutral-ink text-2xl font-semibold">Tienda</h1>
        <div className="flex gap-2">
          <SubLink href="/tienda/categorias" icon={<FolderTree className="size-4" />} label="Categorías" />
          <SubLink href="/tienda/pedidos" icon={<ClipboardList className="size-4" />} label="Pedidos" />
          <SubLink href="/tienda/descuentos" icon={<Tag className="size-4" />} label="Descuentos" />
        </div>
      </div>

      {error && (
        <p className="bg-destructive/10 text-destructive rounded-md px-3 py-6 text-center text-sm">
          No se pudo cargar la lista de productos.
        </p>
      )}

      {!error && filas.length === 0 && (
        <div className="border-neutral-border rounded-lg border bg-white p-8 text-center">
          <Package className="text-neutral-muted mx-auto mb-2 size-8" />
          <p className="text-neutral-muted text-sm">
            Aún no hay productos. Crea uno o corre la migración de Shopify.
          </p>
        </div>
      )}

      {!error && filas.length > 0 && (
        <div className="border-neutral-border overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-neutral-border text-neutral-muted border-b text-left">
                <th className="px-3 py-2 font-medium">Producto</th>
                <th className="px-3 py-2 font-medium">Categoría</th>
                <th className="px-3 py-2 text-right font-medium">Precio</th>
                <th className="px-3 py-2 text-right font-medium">Stock</th>
                <th className="px-3 py-2 text-center font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.id} className="border-neutral-border/60 hover:bg-neutral-cream border-b">
                  <td className="px-3 py-2">
                    <Link href={`/tienda/${f.id}`} className="text-brand-teal font-medium hover:underline">
                      {f.name}
                    </Link>
                    <span className="text-neutral-muted block text-xs">
                      {f.variantes} variante{f.variantes === 1 ? "" : "s"}
                    </span>
                  </td>
                  <td className="text-neutral-muted px-3 py-2">{f.categoria ?? "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{rangoPrecio(f)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{f.stock}</td>
                  <td className="px-3 py-2 text-center">
                    <Badge variant={f.activo ? "default" : "outline"}>
                      {f.activo ? "Activo" : "Oculto"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Link
        href="/tienda/nuevo"
        className="bg-brand-teal hover:bg-brand-teal/90 fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] flex size-14 items-center justify-center rounded-full text-white shadow-lg transition-colors"
        aria-label="Nuevo producto"
      >
        <Plus className="size-6" />
      </Link>
    </div>
  );
}

function rangoPrecio(f: Fila): string {
  if (f.precioMin === null) return "—";
  if (f.precioMin === f.precioMax) return formatMoneda(f.precioMin);
  return `${formatMoneda(f.precioMin)}–${formatMoneda(f.precioMax)}`;
}

function SubLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="border-neutral-border text-neutral-ink hover:bg-neutral-sand inline-flex items-center gap-1.5 rounded-md border bg-white px-2.5 py-1.5 text-xs font-medium transition-colors"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
