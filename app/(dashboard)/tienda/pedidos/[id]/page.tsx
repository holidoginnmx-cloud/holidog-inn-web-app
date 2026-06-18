import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createStoreServerClient } from "@/lib/supabase/store-server";
import { formatMoneda } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FULFILLMENT_LABEL } from "@/lib/labels-tienda";
import type { FulfillmentType, OrderStatus } from "@/lib/supabase/store-types";
import { EstadoPedidoSelector } from "@/components/domain/tienda/EstadoPedidoSelector";
import { TrackingForm } from "@/components/domain/tienda/TrackingForm";

export const dynamic = "force-dynamic";

const fmtFecha = new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeStyle: "short" });

export default async function PedidoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = createStoreServerClient();

  const { data: pedido } = await sb
    .from("orders")
    .select(
      "id, orderNumber, email, status, fulfillmentType, subtotal, discountTotal, shippingTotal, total, notes, stripePaymentIntentId, createdAt, paidAt, shippingAddress, trackingCarrier, trackingNumber",
    )
    .eq("id", id)
    .maybeSingle();

  if (!pedido) notFound();

  const { data: items } = await sb
    .from("order_items")
    .select("id, productNameSnapshot, variantTitleSnapshot, unitPrice, quantity, lineTotal")
    .eq("orderId", id);

  return (
    <div className="space-y-5 pb-24">
      <Link href="/tienda/pedidos" className="text-neutral-muted inline-flex items-center gap-1 text-sm">
        <ArrowLeft className="size-4" /> Volver a pedidos
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-neutral-ink text-2xl font-semibold">Pedido #{pedido.orderNumber}</h1>
        <EstadoPedidoSelector pedidoId={pedido.id} estado={pedido.status as OrderStatus} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Artículos</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-neutral-border text-neutral-muted border-b text-left">
                  <th className="py-2 font-medium">Producto</th>
                  <th className="py-2 text-center font-medium">Cant.</th>
                  <th className="py-2 text-right font-medium">Precio</th>
                  <th className="py-2 text-right font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(items ?? []).map((it) => (
                  <tr key={it.id} className="border-neutral-border/60 border-b">
                    <td className="py-2">
                      {it.productNameSnapshot}
                      {it.variantTitleSnapshot && it.variantTitleSnapshot !== "Único" && (
                        <span className="text-neutral-muted block text-xs">{it.variantTitleSnapshot}</span>
                      )}
                    </td>
                    <td className="py-2 text-center tabular-nums">{it.quantity}</td>
                    <td className="py-2 text-right tabular-nums">{formatMoneda(Number(it.unitPrice))}</td>
                    <td className="py-2 text-right tabular-nums">{formatMoneda(Number(it.lineTotal))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <dl className="mt-4 space-y-1 text-sm">
              <Row label="Subtotal" value={formatMoneda(Number(pedido.subtotal))} />
              {Number(pedido.discountTotal) > 0 && (
                <Row label="Descuento" value={`− ${formatMoneda(Number(pedido.discountTotal))}`} />
              )}
              {Number(pedido.shippingTotal) > 0 && (
                <Row label="Envío" value={formatMoneda(Number(pedido.shippingTotal))} />
              )}
              <Row label="Total" value={formatMoneda(Number(pedido.total))} bold />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-neutral-muted">Cliente:</span> {pedido.email}
            </p>
            <p>
              <span className="text-neutral-muted">Entrega:</span>{" "}
              {FULFILLMENT_LABEL[pedido.fulfillmentType as FulfillmentType]}
            </p>
            {pedido.shippingAddress && (
              <p>
                <span className="text-neutral-muted">Dirección:</span> {pedido.shippingAddress}
              </p>
            )}
            <p>
              <span className="text-neutral-muted">Creado:</span>{" "}
              {fmtFecha.format(new Date(pedido.createdAt))}
            </p>
            {pedido.paidAt && (
              <p>
                <span className="text-neutral-muted">Pagado:</span>{" "}
                {fmtFecha.format(new Date(pedido.paidAt))}
              </p>
            )}
            {pedido.stripePaymentIntentId && (
              <p className="break-all">
                <span className="text-neutral-muted">Stripe PI:</span> {pedido.stripePaymentIntentId}
              </p>
            )}
            {pedido.notes && (
              <p>
                <span className="text-neutral-muted">Notas:</span> {pedido.notes}
              </p>
            )}

            {pedido.fulfillmentType !== "PICKUP" && (
              <div className="border-neutral-border mt-3 border-t pt-3">
                <p className="text-neutral-muted mb-2 text-xs font-medium uppercase">Rastreo del envío</p>
                <TrackingForm
                  pedidoId={pedido.id}
                  carrier={pedido.trackingCarrier}
                  number={pedido.trackingNumber}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-neutral-ink font-semibold" : "text-neutral-muted"}`}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
