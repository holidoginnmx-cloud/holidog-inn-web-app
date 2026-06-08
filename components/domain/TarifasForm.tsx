"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TALLA_LABEL, type PetSize } from "@/lib/labels";
import {
  actualizarTarifasHotel,
  actualizarTarifasEstetica,
} from "@/app/(dashboard)/config/actions";

// Precios de hospedaje (singleton `lodging_pricing`).
export type TarifasHotel = {
  pricePerDaySmall: number;
  pricePerDayLarge: number;
  priceProbarfSmall: number;
  priceProbarfLarge: number;
  daycarePricePerDay: number;
  largeWeightKg: number;
  medicationSurchargePct: number;
};

// Una variante de estética (fila de `service_variants`).
export type VarianteEstetica = {
  id: string;
  petSize: PetSize;
  deslanado: boolean;
  corte: boolean;
  price: number;
};

const HOTEL_CAMPOS: { key: keyof TarifasHotel; label: string }[] = [
  { key: "pricePerDaySmall", label: "Hospedaje por día · talla chica" },
  { key: "pricePerDayLarge", label: "Hospedaje por día · talla grande" },
  { key: "priceProbarfSmall", label: "ProBARF · talla chica" },
  { key: "priceProbarfLarge", label: "ProBARF · talla grande" },
  { key: "daycarePricePerDay", label: "Guardería por día" },
  { key: "largeWeightKg", label: "Peso mínimo talla grande (kg)" },
  { key: "medicationSurchargePct", label: "Recargo por medicación (%)" },
];

function etiquetaVariante(v: VarianteEstetica): string {
  const extras: string[] = [];
  if (v.deslanado) extras.push("deslanado");
  if (v.corte) extras.push("corte");
  const sufijo = extras.length > 0 ? ` (${extras.join(" + ")})` : "";
  return `${TALLA_LABEL[v.petSize]}${sufijo}`;
}

export function TarifasForm({
  hotel,
  estetica,
}: {
  hotel: TarifasHotel | null;
  estetica: VarianteEstetica[];
}) {
  const router = useRouter();

  // ---- Hotel ----
  const [hotelVals, setHotelVals] = useState<Record<keyof TarifasHotel, string>>(() =>
    Object.fromEntries(
      HOTEL_CAMPOS.map(({ key }) => [key, String(hotel?.[key] ?? 0)]),
    ) as Record<keyof TarifasHotel, string>,
  );
  const [hotelPending, setHotelPending] = useState(false);
  const hotelSinCambios =
    !hotel || HOTEL_CAMPOS.every(({ key }) => hotelVals[key] === String(hotel[key]));

  async function onSubmitHotel(e: React.FormEvent) {
    e.preventDefault();
    setHotelPending(true);
    const res = await actualizarTarifasHotel(hotelVals);
    setHotelPending(false);
    if (res.ok) {
      toast.success("Precios de hospedaje guardados");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  // ---- Estética ----
  const [esteticaVals, setEsteticaVals] = useState<Record<string, string>>(() =>
    Object.fromEntries(estetica.map((v) => [v.id, String(v.price)])),
  );
  const [esteticaPending, setEsteticaPending] = useState(false);
  const esteticaSinCambios = estetica.every((v) => esteticaVals[v.id] === String(v.price));

  async function onSubmitEstetica(e: React.FormEvent) {
    e.preventDefault();
    setEsteticaPending(true);
    const res = await actualizarTarifasEstetica({
      variantes: estetica.map((v) => ({ id: v.id, price: esteticaVals[v.id] ?? "0" })),
    });
    setEsteticaPending(false);
    if (res.ok) {
      toast.success("Precios de estética guardados");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="space-y-6">
      {hotel && (
        <form onSubmit={onSubmitHotel} className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-neutral-muted">Hotel</h3>
            <p className="text-xs text-neutral-muted">
              Precios sugeridos al crear una reservación de hospedaje o guardería.
            </p>
            {HOTEL_CAMPOS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <label htmlFor={`hotel-${key}`} className="flex-1 text-sm text-neutral-ink">
                  {label}
                </label>
                <Input
                  id={`hotel-${key}`}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  className="w-28 bg-white"
                  value={hotelVals[key] ?? ""}
                  onChange={(e) =>
                    setHotelVals((s) => ({ ...s, [key]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
          <Button type="submit" disabled={hotelPending || hotelSinCambios} className="w-full">
            {hotelPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Guardar precios de hotel
          </Button>
        </form>
      )}

      {estetica.length > 0 && (
        <form onSubmit={onSubmitEstetica} className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-neutral-muted">Estética</h3>
            <p className="text-xs text-neutral-muted">
              Precio de baño por talla. Las variantes con corte o deslanado se cobran aparte.
            </p>
            {estetica.map((v) => (
              <div key={v.id} className="flex items-center gap-3">
                <label htmlFor={`estetica-${v.id}`} className="flex-1 text-sm text-neutral-ink">
                  {etiquetaVariante(v)}
                </label>
                <Input
                  id={`estetica-${v.id}`}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  className="w-28 bg-white"
                  value={esteticaVals[v.id] ?? ""}
                  onChange={(e) =>
                    setEsteticaVals((s) => ({ ...s, [v.id]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
          <Button
            type="submit"
            disabled={esteticaPending || esteticaSinCambios}
            className="w-full"
          >
            {esteticaPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Guardar precios de estética
          </Button>
        </form>
      )}
    </div>
  );
}
