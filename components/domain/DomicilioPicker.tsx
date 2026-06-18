"use client";

import { useEffect, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { MapPin, X, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buscarDirecciones,
  detalleDireccion,
  type DireccionPrediccion,
} from "@/app/(dashboard)/perros/places-actions";
import type { PerroFormValues } from "./PerroForm";

// Selector de domicilio con autocompletado de Google Places (vía Server Actions
// que hacen de proxy: la key vive en el servidor). Guarda la dirección
// formateada en `perro.domicilio` y las coordenadas en los campos ocultos
// lat/lng/placeId. El domicilio se persiste a nivel del dueño (users.address).
export function DomicilioPicker() {
  const { control, register, setValue } = useFormContext<PerroFormValues>();
  const domicilio = useWatch({ control, name: "perro.domicilio" });

  const [query, setQuery] = useState("");
  const [predicciones, setPredicciones] = useState<DireccionPrediccion[]>([]);
  const [buscando, setBuscando] = useState(false);

  // Token de sesión de Places (agrupa autocomplete + details para facturación).
  // En un ref para no provocar renders; se renueva tras cada selección.
  const tokenRef = useRef<string>("");
  function getToken() {
    if (!tokenRef.current) tokenRef.current = crypto.randomUUID();
    return tokenRef.current;
  }

  // Debounce del autocompletado. El setState ocurre dentro del callback async
  // (no en el cuerpo del effect), como exige react-hooks. Es interacción de
  // usuario, no carga inicial de datos.
  useEffect(() => {
    const t = setTimeout(async () => {
      const q = query.trim();
      if (q.length < 3) {
        setPredicciones([]);
        return;
      }
      setBuscando(true);
      const res = await buscarDirecciones(q, getToken());
      setBuscando(false);
      setPredicciones(res.ok ? res.data : []);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  async function elegir(pred: DireccionPrediccion) {
    const res = await detalleDireccion(pred.placeId, getToken());
    if (!res.ok) return;
    setValue("perro.domicilio", res.data.address);
    setValue("perro.domicilioLat", String(res.data.lat));
    setValue("perro.domicilioLng", String(res.data.lng));
    setValue("perro.domicilioPlaceId", res.data.placeId);
    setQuery("");
    setPredicciones([]);
    tokenRef.current = ""; // nueva sesión para la próxima búsqueda
  }

  function limpiar() {
    setValue("perro.domicilio", "");
    setValue("perro.domicilioLat", "");
    setValue("perro.domicilioLng", "");
    setValue("perro.domicilioPlaceId", "");
    setQuery("");
    setPredicciones([]);
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="perro-domicilio">Domicilio (opcional)</Label>

      {/* Campos ocultos: viajan en el submit junto al resto del formulario. */}
      <input type="hidden" {...register("perro.domicilioLat")} />
      <input type="hidden" {...register("perro.domicilioLng")} />
      <input type="hidden" {...register("perro.domicilioPlaceId")} />

      {domicilio ? (
        <div className="flex items-start gap-2 rounded-md border border-neutral-border bg-white px-3 py-2.5">
          <MapPin className="mt-0.5 size-4 shrink-0 text-brand-teal" aria-hidden />
          <span className="flex-1 text-sm text-neutral-ink">{domicilio}</span>
          <button
            type="button"
            onClick={limpiar}
            aria-label="Quitar domicilio"
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-neutral-muted hover:bg-neutral-sand"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-muted"
              aria-hidden
            />
            <Input
              id="perro-domicilio"
              className="bg-white pl-9"
              placeholder="Busca la dirección…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
            {buscando && (
              <Loader2
                className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-neutral-muted"
                aria-hidden
              />
            )}
          </div>
          {predicciones.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-neutral-border bg-white shadow-lg">
              {predicciones.map((p) => (
                <li key={p.placeId}>
                  <button
                    type="button"
                    onClick={() => elegir(p)}
                    className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-sand"
                  >
                    <MapPin className="mt-0.5 size-4 shrink-0 text-neutral-muted" aria-hidden />
                    <span>{p.description}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <p className="text-xs text-neutral-muted">
        Para el servicio a domicilio. Se guarda con su ubicación de Google Maps.
      </p>
    </div>
  );
}
