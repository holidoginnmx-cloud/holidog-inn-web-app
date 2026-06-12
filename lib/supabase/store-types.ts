// Tipos de las tablas de e-commerce (tienda) para el cliente de Supabase del
// admin. Estas tablas las gestiona Prisma (HolidogInn_App/packages/db), por eso
// las columnas son camelCase. Mientras no se regenere `types.ts` con
// `npm run db:types` (requiere `supabase login`), este archivo provee el tipado.
//
// Solo incluye las tablas que el admin lee/escribe. Carts/cart_items viven en la
// API (checkout del sitio), no aquí.

export type OrderStatus = "PENDING" | "PAID" | "FULFILLED" | "CANCELLED" | "REFUNDED";
export type FulfillmentType = "PICKUP" | "LOCAL_DELIVERY" | "NATIONAL_SHIPPING";
export type DiscountType = "PERCENT" | "FIXED";

// NOTA: deben ser `type` (no `interface`). supabase-js exige que cada tabla
// satisfaga `Record<string, unknown>`; las interfaces no son asignables a eso
// (podrían aumentarse), así que el esquema caería a `never`. Los type-alias sí.
type Timestamps = { createdAt: string; updatedAt: string };

export type ProductCategoryRow = Timestamps & {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type ProductRow = Timestamps & {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  vendor: string;
  brand: string | null;
  isActive: boolean;
  isFeatured: boolean;
  shopifyProductId: string | null;
  categoryId: string | null;
};

export type ProductVariantRow = Timestamps & {
  id: string;
  sku: string | null;
  title: string;
  option1Name: string | null;
  option1Value: string | null;
  option2Name: string | null;
  option2Value: string | null;
  price: number;
  compareAtPrice: number | null;
  isActive: boolean;
  shopifyVariantId: string | null;
  productId: string;
};

export type ProductImageRow = {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
  productId: string;
  variantId: string | null;
};

export type InventoryRow = {
  variantId: string;
  quantity: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  updatedAt: string;
};

export type OrderRow = Timestamps & {
  id: string;
  orderNumber: number;
  email: string;
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  total: number;
  stripePaymentIntentId: string | null;
  notes: string | null;
  paidAt: string | null;
  userId: string | null;
  discountCodeId: string | null;
};

export type OrderItemRow = {
  id: string;
  productNameSnapshot: string;
  variantTitleSnapshot: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  orderId: string;
  variantId: string | null;
};

export type DiscountCodeRow = Timestamps & {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  minSubtotal: number | null;
  firstOrderOnly: boolean;
  maxUses: number | null;
  usesCount: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
};

// Helper: una tabla con Row/Insert/Update. Insert y Update son parciales sobre
// Row (suficiente para el uso del admin; los defaults los pone la DB).
type Table<Row> = {
  Row: Row;
  Insert: Partial<Row> & Record<string, unknown>;
  Update: Partial<Row>;
  Relationships: [];
};

export type StoreDatabase = {
  public: {
    Tables: {
      product_categories: Table<ProductCategoryRow>;
      products: Table<ProductRow>;
      product_variants: Table<ProductVariantRow>;
      product_images: Table<ProductImageRow>;
      inventory: Table<InventoryRow>;
      orders: Table<OrderRow>;
      order_items: Table<OrderItemRow>;
      discount_codes: Table<DiscountCodeRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      OrderStatus: OrderStatus;
      FulfillmentType: FulfillmentType;
      DiscountType: DiscountType;
    };
    CompositeTypes: Record<string, never>;
  };
};
