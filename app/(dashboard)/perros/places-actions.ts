"use server";

import "server-only";
import { type ActionResult } from "@/lib/actions";

// Proxy server-side a Google Places (API legacy), mismo enfoque que la app móvil
// (packages/api/src/lib/maps.ts): la key vive SOLO en el servidor
// (GOOGLE_PLACES_API_KEY) y nunca llega al navegador. Restringido a México.

const AUTOCOMPLETE_URL = "https://maps.googleapis.com/maps/api/place/autocomplete/json";
const DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json";

// Restricción geográfica a Sonora. Dos capas, porque la API legacy no filtra por
// estado: (1) `strictbounds` + un círculo amplio centrado en el estado limita la
// búsqueda a esa zona; (2) además filtramos las predicciones cuya dirección no
// sea de Sonora. Esto NO reduce llamadas (Google factura por request), solo
// acota los resultados a la zona donde HDI da servicio.
const SONORA_CENTER = "29.6,-110.7"; // centro aprox. del estado
const SONORA_RADIUS_M = "300000"; // ~300 km (cubre buena parte de Sonora)
const ES_SONORA = /(\bSon\.?\b|Sonora)/i;

export type DireccionPrediccion = { placeId: string; description: string };
export type DireccionDetalle = { address: string; lat: number; lng: number; placeId: string };

function apiKey(): string | null {
  return process.env.GOOGLE_PLACES_API_KEY ?? null;
}

// Autocompletado de direcciones (predicciones). `sessionToken` agrupa las
// llamadas de una misma búsqueda para la facturación de Google.
export async function buscarDirecciones(
  input: string,
  sessionToken: string,
): Promise<ActionResult<DireccionPrediccion[]>> {
  const key = apiKey();
  if (!key) {
    console.error("[places] GOOGLE_PLACES_API_KEY no configurada");
    return { ok: false, error: "El buscador de direcciones no está configurado." };
  }
  const texto = input.trim();
  if (texto.length < 3) return { ok: true, data: [] };

  const params = new URLSearchParams({
    input: texto,
    key,
    language: "es",
    components: "country:mx",
    location: SONORA_CENTER,
    radius: SONORA_RADIUS_M,
    strictbounds: "true",
    sessiontoken: sessionToken,
  });
  try {
    const res = await fetch(`${AUTOCOMPLETE_URL}?${params.toString()}`);
    const json = await res.json();
    if (json.status !== "OK" && json.status !== "ZERO_RESULTS") {
      console.error("[places] autocomplete:", json.status, json.error_message ?? "");
      return { ok: false, error: "No se pudo buscar la dirección." };
    }
    const data: DireccionPrediccion[] = (json.predictions ?? [])
      .filter((p: { description: string }) => ES_SONORA.test(p.description))
      .map((p: { place_id: string; description: string }) => ({
        placeId: p.place_id,
        description: p.description,
      }));
    return { ok: true, data };
  } catch (e) {
    console.error("[places] autocomplete error:", e);
    return { ok: false, error: "No se pudo buscar la dirección." };
  }
}

// Detalle de un lugar → dirección formateada + coordenadas.
export async function detalleDireccion(
  placeId: string,
  sessionToken: string,
): Promise<ActionResult<DireccionDetalle>> {
  const key = apiKey();
  if (!key) {
    console.error("[places] GOOGLE_PLACES_API_KEY no configurada");
    return { ok: false, error: "El buscador de direcciones no está configurado." };
  }
  const params = new URLSearchParams({
    place_id: placeId,
    key,
    language: "es",
    fields: "geometry,formatted_address",
    sessiontoken: sessionToken,
  });
  try {
    const res = await fetch(`${DETAILS_URL}?${params.toString()}`);
    const json = await res.json();
    if (json.status !== "OK") {
      console.error("[places] details:", json.status, json.error_message ?? "");
      return { ok: false, error: "No se pudo obtener la dirección." };
    }
    const loc = json.result?.geometry?.location;
    if (!loc) return { ok: false, error: "La dirección no tiene coordenadas." };
    return {
      ok: true,
      data: {
        address: json.result.formatted_address ?? "",
        lat: loc.lat,
        lng: loc.lng,
        placeId,
      },
    };
  } catch (e) {
    console.error("[places] details error:", e);
    return { ok: false, error: "No se pudo obtener la dirección." };
  }
}
