"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { actualizarProducto, eliminarProducto } from "@/app/(dashboard)/tienda/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Categoria = { id: string; name: string };

export type ProductoInicial = {
  id: string;
  name: string;
  description: string | null;
  brand: string | null;
  categoryId: string | null;
  isActive: boolean;
  isFeatured: boolean;
};

export function ProductoEditForm({
  producto,
  categorias,
}: {
  producto: ProductoInicial;
  categorias: Categoria[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [borrando, setBorrando] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const res = await actualizarProducto(producto.id, new FormData(e.currentTarget));
    if (res.ok) {
      toast.success("Cambios guardados.");
      router.refresh();
    } else {
      toast.error(res.error);
    }
    setPending(false);
  }

  async function onDelete() {
    if (!confirm(`¿Eliminar "${producto.name}"? Esto borra sus variantes e imágenes.`)) return;
    setBorrando(true);
    const res = await eliminarProducto(producto.id);
    if (res.ok) {
      toast.success("Producto eliminado.");
      router.push("/tienda");
      router.refresh();
    } else {
      toast.error(res.error);
      setBorrando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" defaultValue={producto.name} required className="bg-white" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={producto.description ?? ""}
          className="bg-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="brand">Marca</Label>
          <Input id="brand" name="brand" defaultValue={producto.brand ?? ""} className="bg-white" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="categoryId">Categoría</Label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={producto.categoryId ?? ""}
            className="border-neutral-border h-9 w-full rounded-md border bg-white px-3 text-sm"
          >
            <option value="">Sin categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={producto.isActive} className="size-4" />
          Visible en la tienda
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={producto.isFeatured}
            className="size-4"
          />
          Destacado
        </label>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="destructive"
          onClick={onDelete}
          disabled={borrando}
          size="sm"
        >
          {borrando ? "Eliminando…" : "Eliminar producto"}
        </Button>
        <Button type="submit" disabled={pending} className="bg-brand-teal text-white">
          {pending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
