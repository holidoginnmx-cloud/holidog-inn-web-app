// Paleta de gráficas del dashboard, derivada de la identidad de marca.
import type { Servicio, TipoCosto } from "@/lib/labels";

export const COLOR = {
  teal: "#063F52",
  mustard: "#EB9B22",
  teal2: "#2A7F93",
  teal3: "#5FB0C4",
  amber2: "#C47A14",
  gray: "#8A8A8A",
} as const;

// Ingresos: familia teal. Egresos: mostaza.
export const SERVICIO_COLOR: Record<Servicio, string> = {
  HOTEL: COLOR.teal,
  ESTETICA: COLOR.teal2,
  GUARDERIA: COLOR.teal3,
};

export const TIPO_COSTO_COLOR: Record<TipoCosto, string> = {
  FIJO: COLOR.teal,
  VARIABLE: COLOR.teal2,
  SUELDO: COLOR.mustard,
  MARKETING: COLOR.amber2,
  REINVERSION: COLOR.gray,
};
