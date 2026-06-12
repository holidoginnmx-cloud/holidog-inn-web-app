"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { actualizarEstadoPedido } from "@/app/(dashboard)/tienda/actions";
import { ESTADO_PEDIDO_LABEL } from "@/lib/labels-tienda";
import type { OrderStatus } from "@/lib/supabase/store-types";

const ESTADOS: OrderStatus[] = ["PENDING", "PAID", "FULFILLED", "CANCELLED", "REFUNDED"];

export function EstadoPedidoSelector({
  pedidoId,
  estado,
}: {
  pedidoId: string;
  estado: OrderStatus;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nuevo = e.target.value;
    setPending(true);
    const res = await actualizarEstadoPedido(pedidoId, nuevo);
    if (res.ok) {
      toast.success("Estado actualizado.");
      router.refresh();
    } else {
      toast.error(res.error);
    }
    setPending(false);
  }

  return (
    <select
      value={estado}
      onChange={onChange}
      disabled={pending}
      className="border-neutral-border h-9 rounded-md border bg-white px-3 text-sm"
    >
      {ESTADOS.map((s) => (
        <option key={s} value={s}>
          {ESTADO_PEDIDO_LABEL[s]}
        </option>
      ))}
    </select>
  );
}
