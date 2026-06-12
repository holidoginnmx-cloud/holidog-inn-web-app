import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createStoreServerClient } from "@/lib/supabase/store-server";
import { DescuentosManager, type DescuentoItem } from "@/components/domain/tienda/DescuentosManager";

export const dynamic = "force-dynamic";

export default async function DescuentosPage() {
  let descuentos: DescuentoItem[] = [];
  try {
    const sb = createStoreServerClient();
    const { data } = await sb
      .from("discount_codes")
      .select("id, code, type, value, minSubtotal, firstOrderOnly, maxUses, usesCount, isActive")
      .order("code");
    descuentos = (data ?? []).map((d) => ({
      ...d,
      value: Number(d.value),
      minSubtotal: d.minSubtotal === null ? null : Number(d.minSubtotal),
    }));
  } catch (e) {
    console.error("[tienda/descuentos]", e);
  }

  return (
    <div className="space-y-5 pb-24">
      <Link href="/tienda" className="text-neutral-muted inline-flex items-center gap-1 text-sm">
        <ArrowLeft className="size-4" /> Volver a la tienda
      </Link>
      <h1 className="text-neutral-ink text-2xl font-semibold">Códigos de descuento</h1>
      <DescuentosManager descuentos={descuentos} />
    </div>
  );
}
