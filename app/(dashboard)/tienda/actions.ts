"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { type ActionResult, ERROR_DB, ERROR_GENERICO, validar } from "@/lib/actions";
import { createStoreServerClient, type StoreDB } from "@/lib/supabase/store-server";
import {
  categoriaSchema,
  descuentoSchema,
  envioConfigSchema,
  estadoPedidoSchema,
  nuevoProductoSchema,
  productoSchema,
  trackingSchema,
  varianteSchema,
} from "@/lib/validations/tienda";

const BUCKET = "productos";

// Ejecuta `fn` con el cliente de tienda. Mismo patrón que withSupabase pero
// tipado con StoreDatabase (tablas de e-commerce gestionadas por Prisma).
async function withStore<T>(
  contexto: string,
  fn: (sb: StoreDB) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  let sb: StoreDB;
  try {
    sb = createStoreServerClient();
  } catch (e) {
    console.error(`[tienda:${contexto}] Supabase no configurado:`, e);
    return { ok: false, error: ERROR_DB };
  }
  return fn(sb);
}

const now = () => new Date().toISOString();
const newId = () => crypto.randomUUID();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Garantiza un slug único en la tabla dada (añade sufijo si choca).
async function uniqueSlug(sb: StoreDB, table: "products" | "product_categories", base: string) {
  const root = base || "item";
  let slug = root;
  for (let i = 2; i < 50; i++) {
    const { data } = await sb.from(table).select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    slug = `${root}-${i}`;
  }
  return `${root}-${newId().slice(0, 6)}`;
}

function leer(formData: FormData, campos: string[]): Record<string, FormDataEntryValue | null> {
  return Object.fromEntries(campos.map((c) => [c, formData.get(c)]));
}

// ─── Productos ──────────────────────────────────────────────

export async function crearProducto(
  formData: FormData,
): Promise<ActionResult<{ productoId: string }>> {
  const v = validar(
    nuevoProductoSchema,
    leer(formData, [
      "name",
      "description",
      "brand",
      "categoryId",
      "isActive",
      "isFeatured",
      "precio",
      "stock",
    ]),
  );
  if (!v.ok) return v;
  const p = v.data;

  return withStore("crearProducto", async (sb) => {
    const productId = newId();
    const slug = await uniqueSlug(sb, "products", slugify(p.name));

    const { error: prodErr } = await sb.from("products").insert({
      id: productId,
      slug,
      name: p.name,
      description: p.description,
      brand: p.brand,
      categoryId: p.categoryId,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      vendor: "HolidogInn",
      updatedAt: now(),
    });
    if (prodErr) {
      console.error("[tienda:crearProducto] producto:", prodErr);
      return { ok: false, error: ERROR_GENERICO };
    }

    // Variante única por default (mínimo vendible). Más variantes se añaden luego.
    const variantId = newId();
    const { error: varErr } = await sb.from("product_variants").insert({
      id: variantId,
      productId,
      title: "Único",
      price: p.precio,
      isActive: true,
      updatedAt: now(),
    });
    if (varErr) {
      console.error("[tienda:crearProducto] variante:", varErr);
      return { ok: false, error: ERROR_GENERICO };
    }

    const { error: invErr } = await sb.from("inventory").insert({
      variantId,
      quantity: p.stock,
      trackInventory: true,
      updatedAt: now(),
    });
    if (invErr) {
      console.error("[tienda:crearProducto] inventario:", invErr);
      return { ok: false, error: ERROR_GENERICO };
    }

    revalidatePath("/tienda");
    return { ok: true, data: { productoId: productId } };
  });
}

export async function actualizarProducto(
  productoId: string,
  formData: FormData,
): Promise<ActionResult<{ productoId: string }>> {
  const v = validar(
    productoSchema,
    leer(formData, ["name", "description", "brand", "categoryId", "isActive", "isFeatured"]),
  );
  if (!v.ok) return v;
  const p = v.data;

  return withStore("actualizarProducto", async (sb) => {
    const { error } = await sb
      .from("products")
      .update({
        name: p.name,
        description: p.description,
        brand: p.brand,
        categoryId: p.categoryId,
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        updatedAt: now(),
      })
      .eq("id", productoId);
    if (error) {
      console.error("[tienda:actualizarProducto]", error);
      return { ok: false, error: ERROR_GENERICO };
    }
    revalidatePath("/tienda");
    revalidatePath(`/tienda/${productoId}`);
    return { ok: true, data: { productoId } };
  });
}

export async function eliminarProducto(productoId: string): Promise<ActionResult<null>> {
  return withStore("eliminarProducto", async (sb) => {
    // FKs con onDelete: Cascade limpian variantes/imágenes/inventario.
    const { error } = await sb.from("products").delete().eq("id", productoId);
    if (error) {
      console.error("[tienda:eliminarProducto]", error);
      return { ok: false, error: ERROR_GENERICO };
    }
    revalidatePath("/tienda");
    return { ok: true, data: null };
  });
}

// ─── Variantes ──────────────────────────────────────────────

export async function guardarVariante(
  productoId: string,
  formData: FormData,
  variantId?: string,
): Promise<ActionResult<{ variantId: string }>> {
  const v = validar(
    varianteSchema,
    leer(formData, [
      "title",
      "sku",
      "option1Name",
      "option1Value",
      "option2Name",
      "option2Value",
      "price",
      "compareAtPrice",
      "isActive",
      "quantity",
      "trackInventory",
    ]),
  );
  if (!v.ok) return v;
  const d = v.data;

  return withStore("guardarVariante", async (sb) => {
    const id = variantId ?? newId();
    const variantRow = {
      title: d.title,
      sku: d.sku,
      option1Name: d.option1Name,
      option1Value: d.option1Value,
      option2Name: d.option2Name,
      option2Value: d.option2Value,
      price: d.price,
      compareAtPrice: d.compareAtPrice,
      isActive: d.isActive,
      updatedAt: now(),
    };

    if (variantId) {
      const { error } = await sb.from("product_variants").update(variantRow).eq("id", variantId);
      if (error) {
        console.error("[tienda:guardarVariante] update:", error);
        return { ok: false, error: ERROR_GENERICO };
      }
    } else {
      const { error } = await sb
        .from("product_variants")
        .insert({ ...variantRow, id, productId: productoId });
      if (error) {
        console.error("[tienda:guardarVariante] insert:", error);
        return { ok: false, error: ERROR_GENERICO };
      }
    }

    // Inventario (upsert por variantId, que es PK).
    const { error: invErr } = await sb.from("inventory").upsert({
      variantId: id,
      quantity: d.quantity,
      trackInventory: d.trackInventory,
      updatedAt: now(),
    });
    if (invErr) {
      console.error("[tienda:guardarVariante] inventario:", invErr);
      return { ok: false, error: ERROR_GENERICO };
    }

    revalidatePath(`/tienda/${productoId}`);
    return { ok: true, data: { variantId: id } };
  });
}

export async function eliminarVariante(
  productoId: string,
  variantId: string,
): Promise<ActionResult<null>> {
  return withStore("eliminarVariante", async (sb) => {
    const { error } = await sb.from("product_variants").delete().eq("id", variantId);
    if (error) {
      console.error("[tienda:eliminarVariante]", error);
      return { ok: false, error: ERROR_GENERICO };
    }
    revalidatePath(`/tienda/${productoId}`);
    return { ok: true, data: null };
  });
}

// ─── Imágenes ───────────────────────────────────────────────

async function subirImagen(sb: StoreDB, file: File): Promise<string | null> {
  const ext = file.type === "image/webp" ? "webp" : "jpg";
  const path = `${newId()}.${ext}`;
  const { error } = await sb.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) {
    console.error("[tienda:subirImagen]", error);
    return null;
  }
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function agregarImagen(
  productoId: string,
  formData: FormData,
): Promise<ActionResult<null>> {
  const file = formData.get("imagen");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecciona una imagen." };
  }
  return withStore("agregarImagen", async (sb) => {
    const url = await subirImagen(sb, file);
    if (!url) return { ok: false, error: "No se pudo subir la imagen." };

    // ¿Es la primera imagen del producto? entonces es la principal.
    const { count } = await sb
      .from("product_images")
      .select("id", { count: "exact", head: true })
      .eq("productId", productoId);

    const { error } = await sb.from("product_images").insert({
      id: newId(),
      productId: productoId,
      url,
      sortOrder: count ?? 0,
      isPrimary: (count ?? 0) === 0,
    });
    if (error) {
      console.error("[tienda:agregarImagen] insert:", error);
      return { ok: false, error: ERROR_GENERICO };
    }
    revalidatePath(`/tienda/${productoId}`);
    return { ok: true, data: null };
  });
}

export async function eliminarImagen(
  productoId: string,
  imagenId: string,
): Promise<ActionResult<null>> {
  return withStore("eliminarImagen", async (sb) => {
    const { error } = await sb.from("product_images").delete().eq("id", imagenId);
    if (error) {
      console.error("[tienda:eliminarImagen]", error);
      return { ok: false, error: ERROR_GENERICO };
    }
    revalidatePath(`/tienda/${productoId}`);
    return { ok: true, data: null };
  });
}

export async function marcarImagenPrincipal(
  productoId: string,
  imagenId: string,
): Promise<ActionResult<null>> {
  return withStore("marcarImagenPrincipal", async (sb) => {
    await sb.from("product_images").update({ isPrimary: false }).eq("productId", productoId);
    const { error } = await sb
      .from("product_images")
      .update({ isPrimary: true })
      .eq("id", imagenId);
    if (error) {
      console.error("[tienda:marcarImagenPrincipal]", error);
      return { ok: false, error: ERROR_GENERICO };
    }
    revalidatePath(`/tienda/${productoId}`);
    return { ok: true, data: null };
  });
}

// ─── Categorías ─────────────────────────────────────────────

export async function guardarCategoria(
  formData: FormData,
  categoriaId?: string,
): Promise<ActionResult<{ categoriaId: string }>> {
  const v = validar(categoriaSchema, leer(formData, ["name", "description", "sortOrder", "isActive"]));
  if (!v.ok) return v;
  const c = v.data;

  return withStore("guardarCategoria", async (sb) => {
    if (categoriaId) {
      const { error } = await sb
        .from("product_categories")
        .update({
          name: c.name,
          description: c.description,
          sortOrder: c.sortOrder,
          isActive: c.isActive,
          updatedAt: now(),
        })
        .eq("id", categoriaId);
      if (error) {
        console.error("[tienda:guardarCategoria] update:", error);
        return { ok: false, error: ERROR_GENERICO };
      }
      revalidatePath("/tienda/categorias");
      return { ok: true, data: { categoriaId } };
    }

    const id = newId();
    const slug = await uniqueSlug(sb, "product_categories", slugify(c.name));
    const { error } = await sb.from("product_categories").insert({
      id,
      slug,
      name: c.name,
      description: c.description,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
      updatedAt: now(),
    });
    if (error) {
      console.error("[tienda:guardarCategoria] insert:", error);
      return { ok: false, error: ERROR_GENERICO };
    }
    revalidatePath("/tienda/categorias");
    return { ok: true, data: { categoriaId: id } };
  });
}

export async function eliminarCategoria(categoriaId: string): Promise<ActionResult<null>> {
  return withStore("eliminarCategoria", async (sb) => {
    // Los productos quedan con categoryId = null (FK SetNull en Prisma).
    const { error } = await sb.from("product_categories").delete().eq("id", categoriaId);
    if (error) {
      console.error("[tienda:eliminarCategoria]", error);
      return { ok: false, error: ERROR_GENERICO };
    }
    revalidatePath("/tienda/categorias");
    return { ok: true, data: null };
  });
}

// ─── Pedidos ────────────────────────────────────────────────

export async function actualizarEstadoPedido(
  pedidoId: string,
  estado: string,
): Promise<ActionResult<null>> {
  const v = validar(estadoPedidoSchema, estado);
  if (!v.ok) return v;

  return withStore("actualizarEstadoPedido", async (sb) => {
    const { error } = await sb
      .from("orders")
      .update({ status: v.data, updatedAt: now() })
      .eq("id", pedidoId);
    if (error) {
      console.error("[tienda:actualizarEstadoPedido]", error);
      return { ok: false, error: ERROR_GENERICO };
    }
    revalidatePath("/tienda/pedidos");
    revalidatePath(`/tienda/pedidos/${pedidoId}`);
    return { ok: true, data: null };
  });
}

// Rastreo del envío nacional (paquetería + número de guía).
export async function guardarTracking(
  pedidoId: string,
  formData: FormData,
): Promise<ActionResult<null>> {
  const v = validar(trackingSchema, leer(formData, ["trackingCarrier", "trackingNumber"]));
  if (!v.ok) return v;

  return withStore("guardarTracking", async (sb) => {
    const { error } = await sb
      .from("orders")
      .update({
        trackingCarrier: v.data.trackingCarrier,
        trackingNumber: v.data.trackingNumber,
        updatedAt: now(),
      })
      .eq("id", pedidoId);
    if (error) {
      console.error("[tienda:guardarTracking]", error);
      return { ok: false, error: ERROR_GENERICO };
    }
    revalidatePath(`/tienda/pedidos/${pedidoId}`);
    return { ok: true, data: null };
  });
}

// ─── Configuración de envío nacional ───────────────────────

export async function guardarEnvioConfig(formData: FormData): Promise<ActionResult<null>> {
  const v = validar(envioConfigSchema, leer(formData, ["nationalShippingFee"]));
  if (!v.ok) return v;

  return withStore("guardarEnvioConfig", async (sb) => {
    // Singleton. El upsert solo toca nationalShippingFee/updatedAt; baseFee,
    // pricePerKm e isActive (entrega local) quedan intactos.
    const { error } = await sb.from("delivery_config").upsert({
      id: "singleton",
      nationalShippingFee: v.data.nationalShippingFee,
      updatedAt: now(),
    });
    if (error) {
      console.error("[tienda:guardarEnvioConfig]", error);
      return { ok: false, error: ERROR_GENERICO };
    }
    revalidatePath("/tienda/envio");
    return { ok: true, data: null };
  });
}

// ─── Reseñas (moderación) ───────────────────────────────────

export async function aprobarResena(resenaId: string): Promise<ActionResult<null>> {
  return withStore("aprobarResena", async (sb) => {
    const { error } = await sb
      .from("product_reviews")
      .update({ isApproved: true })
      .eq("id", resenaId);
    if (error) {
      console.error("[tienda:aprobarResena]", error);
      return { ok: false, error: ERROR_GENERICO };
    }
    revalidatePath("/tienda/resenas");
    return { ok: true, data: null };
  });
}

export async function eliminarResena(resenaId: string): Promise<ActionResult<null>> {
  return withStore("eliminarResena", async (sb) => {
    const { error } = await sb.from("product_reviews").delete().eq("id", resenaId);
    if (error) {
      console.error("[tienda:eliminarResena]", error);
      return { ok: false, error: ERROR_GENERICO };
    }
    revalidatePath("/tienda/resenas");
    return { ok: true, data: null };
  });
}

// ─── Descuentos ─────────────────────────────────────────────

export async function guardarDescuento(
  formData: FormData,
  descuentoId?: string,
): Promise<ActionResult<{ descuentoId: string }>> {
  const v = validar(
    descuentoSchema,
    leer(formData, [
      "code",
      "type",
      "value",
      "minSubtotal",
      "firstOrderOnly",
      "maxUses",
      "isActive",
    ]),
  );
  if (!v.ok) return v;
  const d = v.data;

  return withStore("guardarDescuento", async (sb) => {
    const row = {
      code: d.code,
      type: d.type,
      value: d.value,
      minSubtotal: d.minSubtotal,
      firstOrderOnly: d.firstOrderOnly,
      maxUses: d.maxUses,
      isActive: d.isActive,
      updatedAt: now(),
    };
    if (descuentoId) {
      const { error } = await sb.from("discount_codes").update(row).eq("id", descuentoId);
      if (error) {
        console.error("[tienda:guardarDescuento] update:", error);
        return { ok: false, error: ERROR_GENERICO };
      }
      revalidatePath("/tienda/descuentos");
      return { ok: true, data: { descuentoId } };
    }
    const id = newId();
    const { error } = await sb.from("discount_codes").insert({ ...row, id });
    if (error) {
      console.error("[tienda:guardarDescuento] insert:", error);
      return { ok: false, error: ERROR_GENERICO };
    }
    revalidatePath("/tienda/descuentos");
    return { ok: true, data: { descuentoId: id } };
  });
}

export async function eliminarDescuento(descuentoId: string): Promise<ActionResult<null>> {
  return withStore("eliminarDescuento", async (sb) => {
    const { error } = await sb.from("discount_codes").delete().eq("id", descuentoId);
    if (error) {
      console.error("[tienda:eliminarDescuento]", error);
      return { ok: false, error: ERROR_GENERICO };
    }
    revalidatePath("/tienda/descuentos");
    return { ok: true, data: null };
  });
}
