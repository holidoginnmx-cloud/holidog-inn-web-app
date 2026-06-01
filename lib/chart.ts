// Paleta de gráficas del dashboard.
// Semántica financiera: ingreso = familia verde, egreso = familia roja.
import type { Servicio, TipoCosto } from "@/lib/labels";

export const COLOR = {
  // Primarios semánticos.
  ingreso: "#16A34A", // green-600
  egreso: "#DC2626", // red-600
  // Familia verde (ingresos por servicio).
  green700: "#15803D",
  green500: "#22C55E",
  green400: "#4ADE80",
  // Familia roja (egresos por tipo de costo).
  red800: "#991B1B",
  red500: "#EF4444",
  red400: "#F87171",
  red300: "#FCA5A5",
  // Marca (no financiera), por si alguna gráfica la necesita.
  teal: "#063F52",
  mustard: "#EB9B22",
} as const;

// Ingresos: familia verde. Tres tonos para distinguir servicios.
export const SERVICIO_COLOR: Record<Servicio, string> = {
  HOTEL: COLOR.green700,
  ESTETICA: COLOR.green500,
  GUARDERIA: COLOR.green400,
};

// Egresos: familia roja. Un tono por tipo de costo.
export const TIPO_COSTO_COLOR: Record<TipoCosto, string> = {
  FIJO: COLOR.red800,
  VARIABLE: COLOR.egreso,
  SUELDO: COLOR.red500,
  MARKETING: COLOR.red400,
  REINVERSION: COLOR.red300,
};

// Umbrales de alerta por tipo de costo: si el % sobre el total de egresos
// SUPERA el umbral, el rubro está fuera de rango saludable (se marca en rojo).
export const UMBRAL_ALERTA_TIPO_COSTO: Partial<Record<TipoCosto, number>> = {
  FIJO: 20,
  VARIABLE: 25,
  SUELDO: 30,
  MARKETING: 5,
  REINVERSION: 10,
};

// Color del segmento según estado: rojo fuera de rango, verde dentro de rango.
export const COLOR_ESTADO_EGRESO = {
  alerta: COLOR.egreso, // red-600
  ok: COLOR.ingreso, // green-600
} as const;

// ¿El tipo de costo supera su umbral de alerta? `pct` en escala 0-100.
export function esAlertaTipoCosto(tipo: TipoCosto, pct: number): boolean {
  const umbral = UMBRAL_ALERTA_TIPO_COSTO[tipo];
  return umbral != null && pct > umbral;
}

export function colorTipoCosto(tipo: TipoCosto, pct: number): string {
  return esAlertaTipoCosto(tipo, pct) ? COLOR_ESTADO_EGRESO.alerta : COLOR_ESTADO_EGRESO.ok;
}

// Margen de utilidad mínimo saludable (%). Por debajo de esto = alerta.
export const UMBRAL_MARGEN_MIN = 10;
