import Link from "next/link";
import { ArrowLeft, Truck, Bike } from "lucide-react";
import { createStoreServerClient } from "@/lib/supabase/store-server";
import { formatMoneda } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnvioConfigForm } from "@/components/domain/tienda/EnvioConfigForm";

export const dynamic = "force-dynamic";

export default async function EnvioPage() {
  const sb = createStoreServerClient();
  const { data: config } = await sb
    .from("delivery_config")
    .select("baseFee, pricePerKm, isActive, nationalShippingFee")
    .eq("id", "singleton")
    .maybeSingle();

  return (
    <div className="space-y-4 pb-24">
      <Link href="/tienda" className="text-neutral-muted inline-flex items-center gap-1 text-sm">
        <ArrowLeft className="size-4" /> Volver a la tienda
      </Link>

      <h1 className="text-neutral-ink text-2xl font-semibold">Envío</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="text-brand-teal size-5" /> Envío nacional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EnvioConfigForm fee={config?.nationalShippingFee ?? null} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bike className="text-brand-teal size-5" /> Entrega local
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-neutral-muted">Estado:</span>{" "}
            {config?.isActive ? "Activa" : "Desactivada"}
          </p>
          <p>
            <span className="text-neutral-muted">Tarifa base:</span>{" "}
            {formatMoneda(Number(config?.baseFee ?? 0))}
          </p>
          <p>
            <span className="text-neutral-muted">Por km (ida y vuelta):</span>{" "}
            {formatMoneda(Number(config?.pricePerKm ?? 0))}
          </p>
          <p className="text-neutral-muted pt-1 text-xs">
            La entrega local (por distancia) se configura desde la app móvil. Aquí solo se muestra
            como referencia.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
