import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createStoreServerClient } from "@/lib/supabase/store-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ProductoEditForm,
  type ProductoInicial,
} from "@/components/domain/tienda/ProductoEditForm";
import { VariantesEditor, type VarianteInicial } from "@/components/domain/tienda/VariantesEditor";
import { ImagenesEditor, type ImagenInicial } from "@/components/domain/tienda/ImagenesEditor";

export const dynamic = "force-dynamic";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sb = createStoreServerClient();

  const { data: producto } = await sb
    .from("products")
    .select("id, name, description, brand, categoryId, isActive, isFeatured")
    .eq("id", id)
    .maybeSingle();

  if (!producto) notFound();

  const [{ data: variantesRaw }, { data: imagenes }, { data: categorias }] = await Promise.all([
    sb
      .from("product_variants")
      .select(
        "id, title, sku, option1Name, option1Value, option2Name, option2Value, price, compareAtPrice, isActive",
      )
      .eq("productId", id)
      .order("createdAt"),
    sb
      .from("product_images")
      .select("id, url, isPrimary")
      .eq("productId", id)
      .order("sortOrder"),
    sb.from("product_categories").select("id, name").eq("isActive", true).order("sortOrder"),
  ]);

  // Inventario por variante (PK = variantId). `.in` con lista vacía devuelve [].
  const variantIds = (variantesRaw ?? []).map((v) => v.id);
  const { data: inventario } = await sb
    .from("inventory")
    .select("variantId, quantity, trackInventory")
    .in("variantId", variantIds);
  const invByVariant = new Map((inventario ?? []).map((i) => [i.variantId, i]));

  const variantes: VarianteInicial[] = (variantesRaw ?? []).map((v) => {
    const inv = invByVariant.get(v.id);
    return {
      ...v,
      price: Number(v.price),
      compareAtPrice: v.compareAtPrice === null ? null : Number(v.compareAtPrice),
      quantity: inv?.quantity ?? 0,
      trackInventory: inv?.trackInventory ?? true,
    };
  });

  return (
    <div className="space-y-5 pb-24">
      <Link href="/tienda" className="text-neutral-muted inline-flex items-center gap-1 text-sm">
        <ArrowLeft className="size-4" /> Volver a la tienda
      </Link>
      <h1 className="text-neutral-ink text-2xl font-semibold">{producto.name}</h1>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Datos del producto</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductoEditForm producto={producto as ProductoInicial} categorias={categorias ?? []} />
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Imágenes</CardTitle>
            </CardHeader>
            <CardContent>
              <ImagenesEditor productoId={id} imagenes={(imagenes ?? []) as ImagenInicial[]} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Variantes y stock</CardTitle>
            </CardHeader>
            <CardContent>
              <VariantesEditor productoId={id} variantes={variantes} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
