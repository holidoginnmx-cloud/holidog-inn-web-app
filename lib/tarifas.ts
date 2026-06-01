import type { Servicio } from "@/lib/labels";
import { TALLA_LABEL, type Talla } from "@/lib/perro";
import { nochesEntre } from "@/lib/date";
import { formatMoneda } from "@/lib/utils";

// Precios del catálogo, indexados por código. La fuente de verdad es la tabla
// `tarifas` en Supabase (editable en /config). Los RANGOS de peso, en cambio,
// viven aquí: las tallas del catálogo no coinciden con `perros.talla`.
export type Tarifas = Record<string, number>;

// Hotel: dos rangos por peso. ProBarf incluye alimento y abarata el precio.
function hotelTierPorPeso(pesoKg: number): "NORMAL" | "XL" {
  return pesoKg < 20 ? "NORMAL" : "XL";
}

// Hotel a partir de la talla (cuando no hay peso). El hotel parte en 20 kg; solo
// "Grande" (25+ kg) cae con seguridad en XL. Mediano (16–25) se cobra Normal.
function hotelTierPorTalla(talla: Talla): "NORMAL" | "XL" {
  return talla === "GRANDE" ? "XL" : "NORMAL";
}

// Estética (baño): cuatro rangos confirmados por el dueño.
//   1–5 → extra chico · 6–15 → chico · 16–25 → mediano · 25+ → grande
function esteticaCodigoPorPeso(pesoKg: number): string {
  if (pesoKg < 6) return "ESTETICA_XCHICO";
  if (pesoKg < 16) return "ESTETICA_CHICO";
  if (pesoKg <= 25) return "ESTETICA_MEDIANO";
  return "ESTETICA_GRANDE";
}

// La talla ya coincide 1:1 con las categorías de estética.
const ESTETICA_POR_TALLA: Record<Talla, string> = {
  EXTRA_CHICO: "ESTETICA_XCHICO",
  CHICO: "ESTETICA_CHICO",
  MEDIANO: "ESTETICA_MEDIANO",
  GRANDE: "ESTETICA_GRANDE",
};

export type PrecioSugerido = { monto: number; detalle: string };

// Sugerencia de `precio_acordado` para una reservación. Usa el peso del perro si
// existe; si no, cae a su badge de talla. Devuelve `null` cuando no hay base para
// sugerir (guardería, o perro sin peso NI talla, o tarifa ausente).
export function calcularPrecioSugerido(args: {
  servicio: Servicio;
  pesoKg: number | null | undefined;
  talla: Talla | null | undefined;
  fechaInicio: string;
  fechaFin: string | null;
  probarf: boolean;
  tarifas: Tarifas;
}): PrecioSugerido | null {
  const { servicio, pesoKg, talla, fechaInicio, fechaFin, probarf, tarifas } = args;

  // Guardería se cobra caso a caso ($25/h por exceder check-out): no se sugiere.
  if (servicio === "GUARDERIA") return null;

  const tienePeso = pesoKg != null && !Number.isNaN(pesoKg) && pesoKg > 0;
  if (!tienePeso && !talla) return null;
  const porTalla = !tienePeso; // si no hay peso, la base es el badge
  const nota = porTalla ? " · según talla" : "";

  if (servicio === "ESTETICA") {
    const codigo = tienePeso ? esteticaCodigoPorPeso(pesoKg!) : ESTETICA_POR_TALLA[talla!];
    const base = tarifas[codigo];
    if (base == null) return null;
    const etiqueta = tienePeso ? etiquetaTallaEstetica(pesoKg!) : TALLA_LABEL[talla!];
    return { monto: base, detalle: `Estética · ${etiqueta}${nota}` };
  }

  // HOTEL: precio por noche × número de noches (mínimo 1).
  const tier = tienePeso ? hotelTierPorPeso(pesoKg!) : hotelTierPorTalla(talla!);
  const base = tarifas[probarf ? `HOTEL_PROBARF_${tier}` : `HOTEL_${tier}`];
  if (base == null) return null;
  const noches = fechaFin ? Math.max(1, nochesEntre(fechaInicio, fechaFin)) : 1;
  const sufijo = probarf ? " ProBarf" : "";
  return {
    monto: base * noches,
    detalle: `${noches} ${noches === 1 ? "noche" : "noches"} × ${formatMoneda(base)}${sufijo}${nota}`,
  };
}

function etiquetaTallaEstetica(pesoKg: number): string {
  if (pesoKg < 6) return "Extra chico";
  if (pesoKg < 16) return "Chico";
  if (pesoKg <= 25) return "Mediano";
  return "Grande";
}
