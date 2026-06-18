"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { hoyISO, addDiasISO } from "@/lib/date";
import type { VaccineCatalogItem } from "@/lib/validations/salud";
import type { PerroFormValues } from "./PerroForm";

const selectClass =
  "flex h-11 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

// Captura de vacunas individuales (tablas `vaccines` + `vaccine_catalog`). Cada
// fila referencia una vacuna del catálogo; al elegirla, el vencimiento se
// precalcula con `defaultDurationDays` (editable después). Equivale a la captura
// de la app móvil; el `name` de la vacuna lo deriva el servidor del catálogo.
export function VaccinesEditor({ catalogo }: { catalogo: VaccineCatalogItem[] }) {
  const { control, register, setValue, getValues } = useFormContext<PerroFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "vaccines" });

  // Al elegir/cambiar la vacuna del catálogo, precalcula el vencimiento desde la
  // fecha de aplicación + la duración por defecto del catálogo.
  function onCatalogChange(i: number, catalogId: string) {
    const item = catalogo.find((c) => c.id === catalogId);
    if (!item) return;
    const aplicada = getValues(`vaccines.${i}.appliedAt`) || hoyISO();
    setValue(`vaccines.${i}.expiresAt`, addDiasISO(aplicada, item.defaultDurationDays));
  }

  if (catalogo.length === 0) {
    return (
      <fieldset className="space-y-2 rounded-md border border-neutral-border p-3">
        <legend className="px-1 text-sm font-semibold text-brand-teal">Vacunas</legend>
        <p className="text-xs text-neutral-muted">
          No hay vacunas en el catálogo. Pídele al administrador que las dé de alta.
        </p>
      </fieldset>
    );
  }

  return (
    <fieldset className="space-y-3 rounded-md border border-neutral-border p-3">
      <legend className="px-1 text-sm font-semibold text-brand-teal">Vacunas</legend>

      {fields.length === 0 && (
        <p className="text-xs text-neutral-muted">Sin vacunas registradas.</p>
      )}

      {fields.map((field, i) => (
        <div key={field.id} className="space-y-3 rounded-md bg-neutral-sand/40 p-3">
          {/* id del registro existente (vacío en los nuevos): viaja al submit. */}
          <input type="hidden" {...register(`vaccines.${i}.id`)} />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-muted">Vacuna {i + 1}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Eliminar vacuna"
              className="flex size-8 items-center justify-center rounded-md text-neutral-muted hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`vac-cat-${i}`}>Vacuna</Label>
            <select
              id={`vac-cat-${i}`}
              className={selectClass}
              {...register(`vaccines.${i}.catalogId`, {
                onChange: (e) => onCatalogChange(i, e.target.value),
              })}
            >
              <option value="">—</option>
              {catalogo.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`vac-applied-${i}`}>Aplicada</Label>
              <Input
                id={`vac-applied-${i}`}
                type="date"
                className="bg-white"
                {...register(`vaccines.${i}.appliedAt`)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`vac-expires-${i}`}>Vence</Label>
              <Input
                id={`vac-expires-${i}`}
                type="date"
                className="bg-white"
                {...register(`vaccines.${i}.expiresAt`)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`vac-vet-${i}`}>Veterinario (opcional)</Label>
            <Input
              id={`vac-vet-${i}`}
              className="bg-white"
              {...register(`vaccines.${i}.vetName`)}
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => append({ catalogId: "", appliedAt: hoyISO(), expiresAt: "", vetName: "" })}
      >
        <Plus className="size-4" aria-hidden />
        Agregar vacuna
      </Button>
    </fieldset>
  );
}
