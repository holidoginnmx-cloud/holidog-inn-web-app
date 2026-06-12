"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { crearProducto } from "@/app/(dashboard)/tienda/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Categoria = { id: string; name: string };

export function ProductoNuevoForm({ categorias }: { categorias: Categoria[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const res = await crearProducto(new FormData(e.currentTarget));
    if (res.ok) {
      toast.success("Producto creado.");
      router.push(`/tienda/${res.data.productoId}`);
      router.refresh();
      return;
    }
    toast.error(res.error);
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" required className="bg-white" placeholder="Ej. Pelota mordedora" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" name="description" rows={3} className="bg-white" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="brand">Marca</Label>
          <Input id="brand" name="brand" className="bg-white" placeholder="ProBarf, Sharpaw…" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="categoryId">Categoría</Label>
          <select
            id="categoryId"
            name="categoryId"
            className="border-neutral-border h-9 w-full rounded-md border bg-white px-3 text-sm"
            defaultValue=""
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="precio">Precio (MXN)</Label>
          <Input
            id="precio"
            name="precio"
            type="number"
            step="0.01"
            min="0"
            required
            className="bg-white"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="stock">Stock inicial</Label>
          <Input id="stock" name="stock" type="number" min="0" defaultValue={0} className="bg-white" />
        </div>
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked className="size-4" />
          Visible en la tienda
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isFeatured" className="size-4" />
          Destacado
        </label>
      </div>

      <p className="text-neutral-muted text-xs">
        Se crea con una variante única. Podrás añadir más variantes (tallas/tamaños) e imágenes
        después de guardar.
      </p>

      <Button type="submit" disabled={pending} className="bg-brand-teal w-full text-white">
        {pending ? "Guardando…" : "Crear producto"}
      </Button>
    </form>
  );
}
