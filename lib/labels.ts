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
