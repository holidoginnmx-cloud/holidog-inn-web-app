"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { eliminarDescuento, guardarDescuento } from "@/app/(dashboard)/tienda/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type DescuentoItem = {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minSubtotal: number | null;
  firstOrderOnly: boolean;
  maxUses: number | null;
  usesCount: number;
  isActive: boolean;
};

export function DescuentosManager({ descuentos }: { descuentos: DescuentoItem[] }) {
  const [creando, setCreando] = useState(false);
  return (
    <div className="space-y-3">
      {descuentos.map((d) => (
        <DescuentoFila key={d.id} descuento={d} />
      ))}
      {creando ? (
        <DescuentoFila onDone={() => setCreando(false)} />
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setCreando(true)} className="gap-1.5">
          <Plus className="size-4" /> Nuevo descuento
        </Button>
      )}
    </div>
  );
}

function DescuentoFila({ descuento, onDone }: { descuento?: DescuentoItem; onDone?: () => void }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const esNuevo = !descuento;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const res = await guardarDescuento(new FormData(e.currentTarget), descuento?.id);
    if (res.ok) {
      toast.success(esNuevo ? "Descuento creado." : "Descuento guardado.");
      onDone?.();
      router.refresh();
    } else {
      toast.error(res.error);
    }
    setPending(false);
  }

  async function onDelete() {
    if (!descuento) return;
    if (!confirm(`¿Eliminar el código "${descuento.code}"?`)) return;
    setPending(true);
    const res = await eliminarDescuento(descuento.id);
    if (res.ok) {
      toast.success("Descuento eliminado.");
      router.refresh();
    } else {
      toast.error(res.error);
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border-neutral-border grid grid-cols-2 items-end gap-2 rounded-lg border bg-white p-3 sm:grid-cols-12"
    >
      <label className="space-y-1 sm:col-span-2">
        <span className="text-neutral-muted block text-xs">Código</span>
        <Input name="code" defaultValue={descuento?.code ?? ""} required className="h-8 uppercase" />
      </label>
      <label className="space-y-1 sm:col-span-2">
        <span className="text-neutral-muted block text-xs">Tipo</span>
        <select
          name="type"
          defaultValue={descuento?.type ?? "PERCENT"}
          className="border-neutral-border h-8 w-full rounded-md border bg-white px-2 text-sm"
        >
          <option value="PERCENT">% Porcentaje</option>
          <option value="FIXED">$ Fijo</option>
        </select>
      </label>
      <label className="space-y-1 sm:col-span-2">
        <span className="text-neutral-muted block text-xs">Valor</span>
        <Input name="value" type="number" step="0.01" min="0" defaultValue={descuento?.value ?? ""} required className="h-8" />
      </label>
      <label className="space-y-1 sm:col-span-2">
        <span className="text-neutral-muted block text-xs">Mín. subtotal</span>
        <Input name="minSubtotal" type="number" step="0.01" min="0" defaultValue={descuento?.minSubtotal ?? ""} className="h-8" />
      </label>
      <label className="space-y-1 sm:col-span-2">
        <span className="text-neutral-muted block text-xs">Máx. usos</span>
        <Input name="maxUses" type="number" min="0" defaultValue={descuento?.maxUses ?? ""} className="h-8" />
      </label>

      <div className="col-span-2 flex flex-wrap items-center justify-between gap-2 sm:col-span-12">
        <div className="flex gap-4">
          <label className="flex items-center gap-1.5 text-xs">
            <input type="checkbox" name="firstOrderOnly" defaultChecked={descuento?.firstOrderOnly ?? false} className="size-3.5" />
            Solo 1ª compra
          </label>
          <label className="flex items-center gap-1.5 text-xs">
            <input type="checkbox" name="isActive" defaultChecked={descuento?.isActive ?? true} className="size-3.5" />
            Activo
          </label>
          {descuento && (
            <span className="text-neutral-muted text-xs">Usado {descuento.usesCount} vez(es)</span>
          )}
        </div>
        <div className="flex gap-2">
          {descuento && (
            <Button type="button" variant="ghost" size="sm" onClick={onDelete} disabled={pending}>
              <Trash2 className="text-destructive size-4" />
            </Button>
          )}
          {esNuevo && onDone && (
            <Button type="button" variant="ghost" size="sm" onClick={onDone}>
              Cancelar
            </Button>
          )}
          <Button type="submit" size="sm" disabled={pending} className="bg-brand-teal text-white">
            {pending ? "…" : esNuevo ? "Crear" : "Guardar"}
          </Button>
        </div>
      </div>
    </form>
  );
}
