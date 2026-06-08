"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, ERROR_GENERICO, validar, withSupabase } from "@/lib/actions";
import {
  configInputSchema,
  lodgingPricingSchema,
  renombrarCategoriaSchema,
  serviceVariantsSchema,
} from "@/lib/validations/config";

export async function actualizarConfig(input: unknown): Promise<ActionResult<null>> {
  const v = validar(configInputSchema, input);
  if (!v.ok) return v;

  return withSupabase("config", async (supabase) => {
    const { error } = await supabase
      .from("hotel_config")
      .update({ hotelName: v.data.nombre_hotel, maxCapacity: v.data.cupo_maximo })
      .eq("id", "singleton");
    if (error) {
      console.error("[config] Error al actualizar config:", error);
      return { ok: false, error: ERROR_GENERICO };
    }

    revalidatePath("/config");
    revalidatePath("/reservaciones");
    return { ok: true, data: null };
  });
}

// Renombra una categoría en TODOS los egresos que la usan.
export async function renombrarCategoria(
  input: unknown,
): Promise<ActionResult<{ afectados: number }>> {
  const v = validar(renombrarCategoriaSchema, input);
  if (!v.ok) return v;
  const { anterior, nueva } = v.data;
  if (anterior === nueva) return { ok: true, data: { afectados: 0 } };

  return withSupabase("config", async (supabase) => {
    const { data, error } = await supabase
      .from("expenses")
      .update({ category: nueva })
      .eq("category", anterior)
      .select("id");
    if (error) {
      console.error("[config] Error al renombrar categoría:", error);
      return { ok: false, error: ERROR_GENERICO };
    }

    revalidatePath("/config");
    revalidatePath("/");
    return { ok: true, data: { afectados: data?.length ?? 0 } };
  });
}

// Actualiza los precios de hospedaje (singleton `lodging_pricing`).
export async function actualizarTarifasHotel(input: unknown): Promise<ActionResult<null>> {
  const v = validar(lodgingPricingSchema, input);
  if (!v.ok) return v;

  return withSupabase("config", async (supabase) => {
    const { error } = await supabase
      .from("lodging_pricing")
      .update({
        pricePerDaySmall: v.data.pricePerDaySmall,
        pricePerDayLarge: v.data.pricePerDayLarge,
        priceProbarfSmall: v.data.priceProbarfSmall,
        priceProbarfLarge: v.data.priceProbarfLarge,
        daycarePricePerDay: v.data.daycarePricePerDay,
        largeWeightKg: v.data.largeWeightKg,
        medicationSurchargePct: v.data.medicationSurchargePct,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", "singleton");
    if (error) {
      console.error("[config] Error al actualizar precios de hospedaje:", error);
      return { ok: false, error: ERROR_GENERICO };
    }

    revalidatePath("/config");
    revalidatePath("/reservaciones");
    return { ok: true, data: null };
  });
}

// Actualiza los precios de estética (una fila por variante de `service_variants`).
export async function actualizarTarifasEstetica(input: unknown): Promise<ActionResult<null>> {
  const v = validar(serviceVariantsSchema, input);
  if (!v.ok) return v;

  return withSupabase("config", async (supabase) => {
    const updatedAt = new Date().toISOString();
    for (const { id, price } of v.data.variantes) {
      const { error } = await supabase
        .from("service_variants")
        .update({ price, updatedAt })
        .eq("id", id);
      if (error) {
        console.error("[config] Error al actualizar variante de estética:", id, error);
        return { ok: false, error: ERROR_GENERICO };
      }
    }

    revalidatePath("/config");
    revalidatePath("/reservaciones");
    return { ok: true, data: null };
  });
}
