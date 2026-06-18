"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { guardarTracking } from "@/app/(dashboard)/tienda/actions";

// Captura de paquetería + guía para el envío nacional. El cliente lo ve en su
// detalle de pedido (/cuenta/pedidos/[id]).
export function TrackingForm({
  pedidoId,
  carrier,
  number,
}: {
  pedidoId: string;
  carrier: string | null;
  number: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const res = await guardarTracking(pedidoId, new FormData(e.currentTarget));
    if (res.ok) {
      toast.success("Rastreo guardado.");
      router.refresh();
    } else {
      toast.error(res.error);
    }
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input
        name="trackingCarrier"
        defaultValue={carrier ?? ""}
        placeholder="Paquetería (Estafeta, DHL…)"
        maxLength={80}
        className="border-neutral-border h-9 w-full rounded-md border bg-white px-3 text-sm"
      />
      <input
        name="trackingNumber"
        defaultValue={number ?? ""}
        placeholder="Número de guía"
        maxLength={120}
        className="border-neutral-border h-9 w-full rounded-md border bg-white px-3 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="bg-brand-teal hover:bg-brand-teal/90 h-9 w-full rounded-md text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar rastreo"}
      </button>
    </form>
  );
}
