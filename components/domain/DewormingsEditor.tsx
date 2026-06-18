"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { hoyISO, addDiasISO } from "@/lib/date";
import {
  DEWORMING_TYPE_OPTIONS,
  DEWORMING_TYPE_LABEL,
  DEWORMING_DEFAULT_DAYS,
} from "@/lib/validations/salud";
import type { PerroFormValues } from "./PerroForm";

const selectClass =
  "flex h-11 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

// Captura de desparasitaciones (tabla `dewormings`). Lista editable: cada fila
// es un registro con tipo, producto, fechas y notas. Equivale al flujo de la app
// móvil (DewormingCapture): al agregar una fila, expira por defecto a 90 días.
export function DewormingsEditor() {
  const { control, register } = useFormContext<PerroFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "dewormings" });

  return (
    <fieldset className="space-y-3 rounded-md border border-neutral-border p-3">
      <legend className="px-1 text-sm font-semibold text-brand-teal">Desparasitaciones</legend>

      {fields.length === 0 && (
        <p className="text-xs text-neutral-muted">Sin desparasitaciones registradas.</p>
      )}

      {fields.map((field, i) => (
        <div key={field.id} className="space-y-3 rounded-md bg-neutral-sand/40 p-3">
          {/* id del registro existente (vacío en los nuevos): viaja al submit
              para que la Server Action distinga update de insert. */}
          <input type="hidden" {...register(`dewormings.${i}.id`)} />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-muted">Registro {i + 1}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Eliminar desparasitación"
              className="flex size-8 items-center justify-center rounded-md text-neutral-muted hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`dw-type-${i}`}>Tipo</Label>
              <select
                id={`dw-type-${i}`}
                className={selectClass}
                {...register(`dewormings.${i}.type`)}
              >
                {DEWORMING_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {DEWORMING_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`dw-product-${i}`}>Producto</Label>
              <Input
                id={`dw-product-${i}`}
                className="bg-white"
                placeholder="Bravecto, Drontal…"
                {...register(`dewormings.${i}.productName`)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`dw-applied-${i}`}>Aplicada</Label>
              <Input
                id={`dw-applied-${i}`}
                type="date"
                className="bg-white"
                {...register(`dewormings.${i}.appliedAt`)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`dw-expires-${i}`}>Próxima dosis</Label>
              <Input
                id={`dw-expires-${i}`}
                type="date"
                className="bg-white"
                {...register(`dewormings.${i}.expiresAt`)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`dw-vet-${i}`}>Veterinario (opcional)</Label>
            <Input
              id={`dw-vet-${i}`}
              className="bg-white"
              {...register(`dewormings.${i}.vetName`)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`dw-notes-${i}`}>Notas (opcional)</Label>
            <Textarea
              id={`dw-notes-${i}`}
              rows={2}
              className="bg-white"
              {...register(`dewormings.${i}.notes`)}
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() =>
          append({
            type: "BOTH",
            productName: "",
            appliedAt: hoyISO(),
            expiresAt: addDiasISO(hoyISO(), DEWORMING_DEFAULT_DAYS),
            vetName: "",
            notes: "",
          })
        }
      >
        <Plus className="size-4" aria-hidden />
        Agregar desparasitación
      </Button>
    </fieldset>
  );
}
