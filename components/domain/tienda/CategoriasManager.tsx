"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { eliminarCategoria, guardarCategoria } from "@/app/(dashboard)/tienda/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type CategoriaItem = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  productos: number;
};

export function CategoriasManager({ categorias }: { categorias: CategoriaItem[] }) {
  const [creando, setCreando] = useState(false);

  return (
    <div className="space-y-3">
      {categorias.map((c) => (
        <CategoriaFila key={c.id} categoria={c} />
      ))}

      {creando ? (
        <CategoriaFila onDone={() => setCreando(false)} />
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setCreando(true)} className="gap-1.5">
          <Plus className="size-4" /> Nueva categoría
        </Button>
      )}
    </div>
  );
}

function CategoriaFila({ categoria, onDone }: { categoria?: CategoriaItem; onDone?: () => void }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const esNueva = !categoria;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const res = await guardarCategoria(new FormData(e.currentTarget), categoria?.id);
    if (res.ok) {
      toast.success(esNueva ? "Categoría creada." : "Categoría guardada.");
      onDone?.();
      router.refresh();
    } else {
      toast.error(res.error);
    }
    setPending(false);
  }

  async function onDelete() {
    if (!categoria) return;
    if (!confirm(`¿Eliminar "${categoria.name}"? Los productos quedan sin categoría.`)) return;
    setPending(true);
    const res = await eliminarCategoria(categoria.id);
    if (res.ok) {
      toast.success("Categoría eliminada.");
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
      <label className="space-y-1 sm:col-span-4">
        <span className="text-neutral-muted block text-xs">Nombre</span>
        <Input name="name" defaultValue={categoria?.name ?? ""} required className="h-8" />
      </label>
      <label className="space-y-1 sm:col-span-5">
        <span className="text-neutral-muted block text-xs">Descripción</span>
        <Input name="description" defaultValue={categoria?.description ?? ""} className="h-8" />
      </label>
      <label className="space-y-1 sm:col-span-1">
        <span className="text-neutral-muted block text-xs">Orden</span>
        <Input name="sortOrder" type="number" min="0" defaultValue={categoria?.sortOrder ?? 0} className="h-8" />
      </label>
      <label className="flex items-center gap-1.5 text-xs sm:col-span-2">
        <input type="checkbox" name="isActive" defaultChecked={categoria?.isActive ?? true} className="size-3.5" />
        Activa
      </label>

      <div className="col-span-2 flex items-center justify-between gap-2 sm:col-span-12">
        <span className="text-neutral-muted text-xs">
          {categoria ? `${categoria.productos} producto(s)` : "Nueva"}
        </span>
        <div className="flex gap-2">
          {categoria && (
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
            {pending ? "…" : esNueva ? "Crear" : "Guardar"}
          </Button>
        </div>
      </div>
    </form>
  );
}
