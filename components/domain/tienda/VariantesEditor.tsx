"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { eliminarVariante, guardarVariante } from "@/app/(dashboard)/tienda/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type VarianteInicial = {
  id: string;
  title: string;
  sku: string | null;
  option1Name: string | null;
  option1Value: string | null;
  option2Name: string | null;
  option2Value: string | null;
  price: number;
  compareAtPrice: number | null;
  isActive: boolean;
  quantity: number;
  trackInventory: boolean;
};

export function VariantesEditor({
  productoId,
  variantes,
}: {
  productoId: string;
  variantes: VarianteInicial[];
}) {
  const [agregando, setAgregando] = useState(false);

  return (
    <div className="space-y-3">
      {variantes.map((v) => (
        <VarianteFila key={v.id} productoId={productoId} variante={v} />
      ))}

      {agregando ? (
        <VarianteFila productoId={productoId} onDone={() => setAgregando(false)} />
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAgregando(true)}
          className="gap-1.5"
        >
          <Plus className="size-4" /> Añadir variante
        </Button>
      )}
    </div>
  );
}

function VarianteFila({
  productoId,
  variante,
  onDone,
}: {
  productoId: string;
  variante?: VarianteInicial;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const esNueva = !variante;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const res = await guardarVariante(productoId, new FormData(e.currentTarget), variante?.id);
    if (res.ok) {
      toast.success(esNueva ? "Variante añadida." : "Variante guardada.");
      onDone?.();
      router.refresh();
    } else {
      toast.error(res.error);
    }
    setPending(false);
  }

  async function onDelete() {
    if (!variante) return;
    if (!confirm(`¿Eliminar la variante "${variante.title}"?`)) return;
    setPending(true);
    const res = await eliminarVariante(productoId, variante.id);
    if (res.ok) {
      toast.success("Variante eliminada.");
      router.refresh();
    } else {
      toast.error(res.error);
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border-neutral-border grid grid-cols-2 gap-2 rounded-lg border bg-white p-3 sm:grid-cols-4"
    >
      <Field label="Título" className="sm:col-span-2">
        <Input name="title" defaultValue={variante?.title ?? ""} required className="h-8" />
      </Field>
      <Field label="SKU">
        <Input name="sku" defaultValue={variante?.sku ?? ""} className="h-8" />
      </Field>
      <Field label="Precio">
        <Input
          name="price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={variante?.price ?? ""}
          required
          className="h-8"
        />
      </Field>
      <Field label="Opción 1 (nombre)">
        <Input name="option1Name" defaultValue={variante?.option1Name ?? ""} className="h-8" placeholder="Talla" />
      </Field>
      <Field label="Opción 1 (valor)">
        <Input name="option1Value" defaultValue={variante?.option1Value ?? ""} className="h-8" placeholder="M" />
      </Field>
      <Field label="Antes (opc.)">
        <Input
          name="compareAtPrice"
          type="number"
          step="0.01"
          min="0"
          defaultValue={variante?.compareAtPrice ?? ""}
          className="h-8"
        />
      </Field>
      <Field label="Stock">
        <Input
          name="quantity"
          type="number"
          min="0"
          defaultValue={variante?.quantity ?? 0}
          className="h-8"
        />
      </Field>
      {/* option2 ocultos por simplicidad; se envían vacíos */}
      <input type="hidden" name="option2Name" value="" />
      <input type="hidden" name="option2Value" value="" />

      <div className="col-span-2 flex flex-wrap items-center justify-between gap-2 sm:col-span-4">
        <div className="flex gap-4">
          <label className="flex items-center gap-1.5 text-xs">
            <input type="checkbox" name="isActive" defaultChecked={variante?.isActive ?? true} className="size-3.5" />
            Activa
          </label>
          <label className="flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              name="trackInventory"
              defaultChecked={variante?.trackInventory ?? true}
              className="size-3.5"
            />
            Controlar stock
          </label>
        </div>
        <div className="flex gap-2">
          {variante && (
            <Button type="button" variant="ghost" size="sm" onClick={onDelete} disabled={pending}>
              <Trash2 className="text-destructive size-4" />
            </Button>
          )}
          {esNueva && onDone && (
            <Button type="button" variant="ghost" size="sm" onClick={onDone}>
              Cancelar
            </Button>
          )}
          <Button type="submit" size="sm" disabled={pending} className="bg-brand-teal text-white">
            {pending ? "…" : esNueva ? "Añadir" : "Guardar"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`space-y-1 ${className ?? ""}`}>
      <span className="text-neutral-muted block text-xs">{label}</span>
      {children}
    </label>
  );
}
