import type { Enums } from "@/lib/supabase/types";

// ============================================================================
//  Mapeos UI (español) <-> esquema unificado en inglés (Prisma)
// ============================================================================
// El UI sigue hablando en español (HOTEL/ESTETICA/GUARDERIA, RESERVADA/...).
// La DB usa los enums de Prisma (STAY/BATH/DAYCARE, CONFIRMED/...). Estos
// helpers traducen en ambos sentidos. Las LECTURAS suelen usar alias en el
// select; los enums sí requieren traducción explícita con estos mapas.

// ---- Servicio (UI) <-> ReservationType (DB) --------------------------------
export type Servicio = "HOTEL" | "ESTETICA" | "GUARDERIA";
export type ReservationType = Enums<"ReservationType">; // STAY | BATH | DAYCARE

export const SERVICIO_OPTIONS = ["HOTEL", "ESTETICA", "GUARDERIA"] as const;
export const SERVICIO_LABEL: Record<Servicio, string> = {
  HOTEL: "Hotel",
  ESTETICA: "Estética",
  GUARDERIA: "Guardería",
};

const SERVICIO_TO_TYPE: Record<Servicio, ReservationType> = {
  HOTEL: "STAY",
  ESTETICA: "BATH",
  GUARDERIA: "DAYCARE",
};
const TYPE_TO_SERVICIO: Record<ReservationType, Servicio> = {
  STAY: "HOTEL",
  BATH: "ESTETICA",
  DAYCARE: "GUARDERIA",
};
export const servicioToType = (s: Servicio): ReservationType => SERVICIO_TO_TYPE[s];
export const typeToServicio = (t: ReservationType): Servicio => TYPE_TO_SERVICIO[t];

// ---- Estado (UI) <-> ReservationStatus (DB) --------------------------------
export type ReservacionEstado = "RESERVADA" | "EN_CURSO" | "FINALIZADA" | "CANCELADA";
export type ReservationStatus = Enums<"ReservationStatus">; // CONFIRMED | CHECKED_IN | CHECKED_OUT | CANCELLED

export const ESTADO_OPTIONS = ["RESERVADA", "EN_CURSO", "FINALIZADA", "CANCELADA"] as const;
export const ESTADO_LABEL: Record<ReservacionEstado, string> = {
  RESERVADA: "Reservada",
  EN_CURSO: "En curso",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

const ESTADO_TO_STATUS: Record<ReservacionEstado, ReservationStatus> = {
  RESERVADA: "CONFIRMED",
  EN_CURSO: "CHECKED_IN",
  FINALIZADA: "CHECKED_OUT",
  CANCELADA: "CANCELLED",
};
const STATUS_TO_ESTADO: Record<ReservationStatus, ReservacionEstado> = {
  CONFIRMED: "RESERVADA",
  CHECKED_IN: "EN_CURSO",
  CHECKED_OUT: "FINALIZADA",
  CANCELLED: "CANCELADA",
};
export const estadoToStatus = (e: ReservacionEstado): ReservationStatus => ESTADO_TO_STATUS[e];
export const statusToEstado = (s: ReservationStatus): ReservacionEstado => STATUS_TO_ESTADO[s];

// ---- Tipo de pago (UI) <-> PaymentKind (DB; valores idénticos) -------------
export type PagoTipo = "ANTICIPO" | "ABONO" | "RESTANTE";
export const PAGO_TIPO_OPTIONS = ["ANTICIPO", "ABONO", "RESTANTE"] as const;
export const PAGO_TIPO_LABEL: Record<PagoTipo, string> = {
  ANTICIPO: "Anticipo",
  ABONO: "Abono",
  RESTANTE: "Restante",
};

// ---- Método de pago (UI) <-> PaymentMethod (DB) ----------------------------
export type MetodoPago = Enums<"PaymentMethod">; // CASH | CARD | TRANSFER | STRIPE | CREDIT
export const METODO_OPTIONS = ["CASH", "CARD", "TRANSFER", "STRIPE", "CREDIT"] as const;
export const METODO_LABEL: Record<MetodoPago, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
  STRIPE: "Stripe",
  CREDIT: "Crédito",
};

// ---- Tipo de costo (UI) <-> CostType (DB; valores idénticos) ---------------
export type TipoCosto = Enums<"CostType">; // FIJO | VARIABLE | SUELDO | MARKETING | REINVERSION
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

// ---- Talla (UI/legacy) <-> PetSize (DB) ------------------------------------
// La talla legacy (EXTRA_CHICO/CHICO/MEDIANO/GRANDE) ahora es PetSize
// (XS/S/M/L/XL). El UI muestra la etiqueta a partir de PetSize.
export type PetSize = Enums<"PetSize">; // XS | S | M | L | XL
export const TALLA_LABEL: Record<PetSize, string> = {
  XS: "Extra chico",
  S: "Chico",
  M: "Mediano",
  L: "Grande",
  XL: "Gigante",
};

// ============================================================================
//  Categorías de egresos (texto libre) + sugerencia de tipo de costo
// ============================================================================
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
