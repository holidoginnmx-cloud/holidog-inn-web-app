import type { Enums } from "@/lib/supabase/types";

export type Servicio = Enums<"servicio_tipo">;
export type PagoTipo = Enums<"pago_tipo">;
export type TipoCosto = Enums<"tipo_costo">;
export type ReservacionEstado = Enums<"reservacion_estado">;

export const SERVICIO_OPTIONS = ["HOTEL", "ESTETICA", "GUARDERIA"] as const;
export const SERVICIO_LABEL: Record<Servicio, string> = {
  HOTEL: "Hotel",
  ESTETICA: "Estética",
  GUARDERIA: "Guardería",
};

export const PAGO_TIPO_OPTIONS = ["ANTICIPO", "ABONO", "RESTANTE"] as const;
export const PAGO_TIPO_LABEL: Record<PagoTipo, string> = {
  ANTICIPO: "Anticipo",
  ABONO: "Abono",
  RESTANTE: "Restante",
};

export const TIPO_COSTO_OPTIONS = [
  "FIJO",
  "VARIABLE",
  "SUELDO",
  "MARKETING",
  "REINVERSION",
] as const;
export const TIPO_COSTO_LABEL: Record<TipoCosto, string> = {
  FIJO: "Fijo",
  VARIABLE: "Variable",
  SUELDO: "Sueldo",
  MARKETING: "Marketing",
  REINVERSION: "Reinversión",
};

export const ESTADO_OPTIONS = ["RESERVADA", "EN_CURSO", "FINALIZADA", "CANCELADA"] as const;
export const ESTADO_LABEL: Record<ReservacionEstado, string> = {
  RESERVADA: "Reservada",
  EN_CURSO: "En curso",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

// Categorías reales del Excel (CLAUDE.md §4). Siembran el autocomplete aunque
// la BD aún no tenga egresos; se fusionan con las categorías distintas reales.
export const CATEGORIAS_CONOCIDAS = [
  "Transporte / Logística",
  "Bano/ Estetica",
  "RH / Asistente",
  "Servicios básicos",
  "Limpieza / Insumos",
  "Administración / Oficina",
  "Marketing / Ads",
  "Marketing / Merchandising",
  "Reinvención / Mobiliario",
  "Reinvención / Obra",
  "Reinvención / Equipamiento",
  "tienda/ Estetica",
  "FESTEJO",
  "CAFE VAINILLA",
  "mantenimiento",
] as const;

// Mapeo categoría → tipo de costo, derivado del histórico del Excel. Al elegir
// una categoría conocida se autoselecciona su tipo de costo (el usuario puede
// sobreescribirlo). Las llaves se normalizan (trim + minúsculas) para tolerar
// variaciones de espacios/acentos vistas en el Excel.
const CATEGORIA_TIPO_COSTO: Record<string, TipoCosto> = {
  "transporte / logística": "VARIABLE",
  "bano/ estetica": "VARIABLE",
  "rh / asistente": "SUELDO",
  "servicios básicos": "FIJO",
  "limpieza / insumos": "VARIABLE",
  limpieza: "VARIABLE",
  "administración / oficina": "FIJO",
  "marketing / ads": "MARKETING",
  "marketing / merchandising": "MARKETING",
  marketing: "MARKETING",
  "reinvención / mobiliario": "REINVERSION",
  "reinvención / obra": "REINVERSION",
  "reinvención / equipamiento": "REINVERSION",
  "reinvención / remodelación": "REINVERSION",
  "tienda/ estetica": "VARIABLE",
  festejo: "VARIABLE",
  "cafe vainilla": "VARIABLE",
  mantenimiento: "VARIABLE",
  "horas extra": "FIJO",
  posada: "VARIABLE",
  "inversion/administrativa": "REINVERSION",
  "mkt y y atencion al cliente": "SUELDO",
  "administracion y cdc": "SUELDO",
  operativo: "SUELDO",
  "registro de marca": "REINVERSION",
  "cancelacion de servicio": "VARIABLE",
};

/** Sugiere el tipo de costo para una categoría conocida; null si no hay match. */
export function tipoCostoSugerido(categoria: string | null | undefined): TipoCosto | null {
  if (!categoria) return null;
  return CATEGORIA_TIPO_COSTO[categoria.trim().toLowerCase()] ?? null;
}
