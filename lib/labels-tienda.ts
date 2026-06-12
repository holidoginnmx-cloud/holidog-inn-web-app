import type { FulfillmentType, OrderStatus } from "@/lib/supabase/store-types";

export const ESTADO_PEDIDO_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pendiente de pago",
  PAID: "Pagado",
  FULFILLED: "Entregado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

// Variante de Badge para cada estado.
export const ESTADO_PEDIDO_BADGE: Record<OrderStatus, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  PAID: "default",
  FULFILLED: "secondary",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

export const FULFILLMENT_LABEL: Record<FulfillmentType, string> = {
  PICKUP: "Recoger en hotel",
  LOCAL_DELIVERY: "Entrega local",
  NATIONAL_SHIPPING: "Envío nacional",
};

export const TIPO_DESCUENTO_LABEL: Record<"PERCENT" | "FIXED", string> = {
  PERCENT: "Porcentaje",
  FIXED: "Monto fijo",
};
