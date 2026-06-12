import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { createStoreServerClient } from "@/lib/supabase/store-server";
import { formatMoneda } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ESTADO_PEDIDO_BADGE, ESTADO_PEDIDO_LABEL, FULFILLMENT_LABEL } from "@/lib/labels-tienda";
import type { FulfillmentType, OrderStatus } from "@/lib/supabase/store-types";

export const dynamic = "force-dynamic";

const fmtFecha = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" });

export default async function PedidosPage() {
  let pedidos: {
    id: string;
    orderNumber: number;
    email: string;
    status: OrderStatus;
    fulfillmentType: FulfillmentType;
    total: number;
    createdAt: string;
  }[] = [];
  let error = false;

  try {
    const sb = createStoreServerClient();
    const { data } = await sb
      .from("orders")
      .select("id, orderNumber, email, status, fulfillmentType, total, createdAt")
      .order("createdAt", { ascending: false });
    pedidos = (data ?? []).map((o) => ({ ...o, total: Number(o.total) }));
  } catch (e) {
    console.error("[tienda/pedidos]", e);
    error = true;
  }

  return (
    <div className="space-y-5 pb-24">
      <Link href="/tienda" className="text-neutral-muted inline-flex items-center gap-1 text-sm">
        <ArrowLeft className="size-4" /> Volver a la tienda
      </Link>
      <h1 className="text-neutral-ink text-2xl font-semibold">Pedidos</h1>

      {error && (
        <p className="bg-destructive/10 text-destructive rounded-md px-3 py-6 text-center text-sm">
          No se pudieron cargar los pedidos.
        </p>
      )}

      {!error && pedidos.length === 0 && (
        <div className="border-neutral-border rounded-lg border bg-white p-8 text-center">
          <ClipboardList className="text-neutral-muted mx-auto mb-2 size-8" />
          <p className="text-neutral-muted text-sm">Aún no hay pedidos.</p>
        </div>
      )}

      {!error && pedidos.length > 0 && (
        <div className="border-neutral-border overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-neutral-border text-neutral-muted border-b text-left">
                <th className="px-3 py-2 font-medium">#</th>
                <th className="px-3 py-2 font-medium">Cliente</th>
                <th className="px-3 py-2 font-medium">Entrega</th>
                <th className="px-3 py-2 text-right font-medium">Total</th>
                <th className="px-3 py-2 text-center font-medium">Estado</th>
                <th className="px-3 py-2 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((o) => (
                <tr key={o.id} className="border-neutral-border/60 hover:bg-neutral-cream border-b">
                  <td className="px-3 py-2">
                    <Link href={`/tienda/pedidos/${o.id}`} className="text-brand-teal font-medium hover:underline">
                      #{o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{o.email}</td>
                  <td className="text-neutral-muted px-3 py-2">{FULFILLMENT_LABEL[o.fulfillmentType]}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMoneda(o.total)}</td>
                  <td className="px-3 py-2 text-center">
                    <Badge variant={ESTADO_PEDIDO_BADGE[o.status]}>{ESTADO_PEDIDO_LABEL[o.status]}</Badge>
                  </td>
                  <td className="text-neutral-muted px-3 py-2 text-xs">
                    {fmtFecha.format(new Date(o.createdAt))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
