import type { Enums } from "@/lib/supabase/types";
import { one } from "@/lib/supabase/helpers";

type PetSize = Enums<"PetSize">;

// ============================================================================
//  Estética (baño / deslanado / corte) — modelo compartido con la app móvil
// ============================================================================
// El baño se modela como una fila en `reservation_addons` que apunta a una
// `service_variant` de tipo BATH. La variante lleva los flags `corte` y
// `deslanado`. "Baño incluido" = existe ese addon (o la reserva ES de tipo
// BATH, donde el baño es intrínseco). No hay "corte/deslanado" sin baño.

// Tallas con variante de baño sembrada en la BD (no hay XS: se cobra como S).
export type BathSize = "S" | "M" | "L" | "XL";

// Mapea la talla del perro a la talla con la que existe variante de baño.
// Replica la lógica de la API móvil (baths.ts:bathSizeKey + sizeFromWeight):
// XS→S; si no hay talla, se deriva del peso; fallback final "M".
export function bathSizeKey(size: PetSize | null, weightKg?: number | null): BathSize {
  if (size === "S" || size === "M" || size === "L" || size === "XL") return size;
  if (size === "XS") return "S";
  if (weightKg != null) {
    if (weightKg <= 5) return "S";
    if (weightKg <= 15) return "M";
    if (weightKg <= 24) return "L";
    return "XL";
  }
  return "M";
}

// Select embebido reutilizable: trae el/los addon(s) con su variante y el
// código del tipo de servicio, suficiente para derivar baño/corte/deslanado.
export const RESV_ADDON_SELECT =
  "reservation_addons(id, unitPrice, variant:service_variants(corte, deslanado, serviceType:service_types(code)))";

// Forma del addon embebido tras el select de arriba (Supabase puede devolver
// las relaciones to-one como objeto o como array de un elemento).
type AddonEmbed = {
  variant:
    | {
        corte: boolean | null;
        deslanado: boolean | null;
        serviceType: { code: string | null } | { code: string | null }[] | null;
      }
    | {
        corte: boolean | null;
        deslanado: boolean | null;
        serviceType: { code: string | null } | { code: string | null }[] | null;
      }[]
    | null;
};

export type EsteticaFlags = {
  incluyeBano: boolean;
  incluyeCorte: boolean;
  incluyeDeslanado: boolean;
};

// Deriva los flags de estética de una reserva a partir de su tipo y sus addons.
// - Estética (BATH): el baño es intrínseco aunque no haya addon (datos legacy).
// - Hotel/Guardería: el baño existe solo si hay un addon de variante BATH.
// - corte/deslanado vienen de la variante del addon BATH (si existe).
export function derivarEstetica(
  reservationType: Enums<"ReservationType">,
  addons: AddonEmbed[] | null | undefined,
): EsteticaFlags {
  const bathAddon = (addons ?? []).find((a) => {
    const variant = one(a.variant);
    const code = one(variant?.serviceType)?.code;
    return code === "BATH";
  });
  const variant = one(bathAddon?.variant);

  return {
    incluyeBano: reservationType === "BATH" || bathAddon != null,
    incluyeCorte: variant?.corte ?? false,
    incluyeDeslanado: variant?.deslanado ?? false,
  };
}
