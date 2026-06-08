import type { Servicio, PetSize } from "@/lib/labels";
import { TALLA_LABEL, type Talla } from "@/lib/perro";
import { nochesEntre } from "@/lib/date";
import { formatMoneda } from "@/lib/utils";

// Catálogo de precios para sugerir `precio_acordado`. La fuente de verdad son
// las tablas unificadas `lodging_pricing` (singleton: hotel + guardería, por
// peso) y `service_variants` (estética: una fila por talla/corte/deslanado).
// data.ts arma este objeto a partir de esas tablas.
export type Tarifas = {
  // Hotel: precio por noche según el peso (umbral `largeWeightKg`).
  pricePerDaySmall: number;
  pricePerDayLarge: number;
  priceProbarfSmall: number;
  priceProbarfLarge: number;
  // Guardería: precio por día (no se sugiere, pero se conserva por completitud).
  daycarePricePerDay: number;
  // Umbral de peso (kg) a partir del cual el hotel cobra tarifa "Large".
  largeWeightKg: number;
  // Estética: precio base de baño por talla (PetSize). Se toma la variante más
  // barata por talla (típicamente sin corte ni deslanado) como sugerencia base.
  esteticaPorTalla: Partial<Record<PetSize, number>>;
};

// Talla legacy (del badge del perro) -> PetSize del esquema unificado.
// El hotel parte en `largeWeightKg`; sin peso usamos el badge: solo "Grande"
// cae con seguridad en la tarifa Large.
const TALLA_TO_PETSIZE: Record<Talla, PetSize> = {
  EXTRA_CHICO: "XS",
  CHICO: "S",
  MEDIANO: "M",
  GRANDE: "L",
};

// Hotel: ¿el perro cae en la tarifa "Large"? Por peso usa el umbral configurable;
// sin peso, solo "Grande" se considera Large.
function esLargePorPeso(pesoKg: number, largeWeightKg: number): boolean {
  return pesoKg >= largeWeightKg;
}
function esLargePorTalla(talla: Talla): boolean {
  return talla === "GRANDE";
}

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
    // La estética se cobra por talla (PetSize). Sin peso usamos el badge.
    const petSize = tienePeso ? petSizePorPeso(pesoKg!, tarifas) : TALLA_TO_PETSIZE[talla!];
    const base = tarifas.esteticaPorTalla[petSize];
    if (base == null) return null;
    const etiqueta = tienePeso ? etiquetaTallaEstetica(pesoKg!) : TALLA_LABEL[talla!];
    return { monto: base, detalle: `Estética · ${etiqueta}${nota}` };
  }

  // HOTEL: precio por noche × número de noches (mínimo 1).
  const esLarge = tienePeso
    ? esLargePorPeso(pesoKg!, tarifas.largeWeightKg)
    : esLargePorTalla(talla!);
  const base = probarf
    ? esLarge
      ? tarifas.priceProbarfLarge
      : tarifas.priceProbarfSmall
    : esLarge
      ? tarifas.pricePerDayLarge
      : tarifas.pricePerDaySmall;
  if (base == null) return null;
  const noches = fechaFin ? Math.max(1, nochesEntre(fechaInicio, fechaFin)) : 1;
  const sufijo = probarf ? " ProBarf" : "";
  return {
    monto: base * noches,
    detalle: `${noches} ${noches === 1 ? "noche" : "noches"} × ${formatMoneda(base)}${sufijo}${nota}`,
  };
}

// PetSize estimado a partir del peso, usando el mismo escalado que la estética.
// Para el hotel solo importa small/large; aquí lo usamos para elegir variante
// de baño cuando hay peso pero no badge de talla.
function petSizePorPeso(pesoKg: number, tarifas: Tarifas): PetSize {
  if (pesoKg < 6) return "XS";
  if (pesoKg < 16) return "S";
  if (pesoKg <= 25) return "M";
  return pesoKg >= tarifas.largeWeightKg ? "L" : "M";
}

function etiquetaTallaEstetica(pesoKg: number): string {
  if (pesoKg < 6) return "Extra chico";
  if (pesoKg < 16) return "Chico";
  if (pesoKg <= 25) return "Mediano";
  return "Grande";
}
