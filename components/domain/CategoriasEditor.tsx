"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Pencil, Check, X, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./EmptyState";
import { renombrarCategoria } from "@/app/(dashboard)/config/actions";

export type CategoriaUso = { nombre: string; usos: number };

export function CategoriasEditor({ categorias }: { categorias: CategoriaUso[] }) {
  const router = useRouter();
  const [editando, setEditando] = useState<string | null>(null);
  const [valor, setValor] = useState("");
  const [pending, setPending] = useState(false);

  function empezar(nombre: string) {
    setEditando(nombre);
    setValor(nombre);
  }

  async function guardar(anterior: string) {
    const nueva = valor.trim();
    if (!nueva || nueva === anterior) {
      setEditando(null);
      return;
    }
    setPending(true);
    const res = await renombrarCategoria({ anterior, nueva });
    setPending(false);
    if (res.ok) {
      toast.success(
        res.data.afectados > 0
          ? `Categoría renombrada (${res.data.afectados} egresos actualizados)`
          : "Categoría renombrada",
      );
      setEditando(null);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  if (categorias.length === 0) {
    return (
      <EmptyState
        icon={Tag}
        title="Sin categorías todavía"
        description="Aparecerán aquí cuando registres egresos."
      />
    );
  }

  return (
    <ul className="divide-y divide-neutral-border overflow-hidden rounded-xl border border-neutral-border bg-white">
      {categorias.map((c) => (
        <li key={c.nombre} className="flex items-center gap-2 p-3">
          {editando === c.nombre ? (
            <>
              <Input
                autoFocus
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="h-9 flex-1 bg-white"
                onKeyDown={(e) => {
                  if (e.key === "Enter") guardar(c.nombre);
                  if (e.key === "Escape") setEditando(null);
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                aria-label="Guardar"
                disabled={pending}
                onClick={() => guardar(c.nombre)}
              >
                <Check className="size-4 text-emerald-600" aria-hidden />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Cancelar"
                disabled={pending}
                onClick={() => setEditando(null)}
              >
                <X className="size-4 text-neutral-muted" aria-hidden />
              </Button>
            </>
          ) : (
            <>
              <span className="flex-1 truncate text-sm text-neutral-ink">{c.nombre}</span>
              <span className="shrink-0 rounded-full bg-neutral-sand px-2 py-0.5 text-xs text-neutral-muted">
                {c.usos} {c.usos === 1 ? "uso" : "usos"}
              </span>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Renombrar ${c.nombre}`}
                onClick={() => empezar(c.nombre)}
              >
                <Pencil className="size-4 text-neutral-muted" aria-hidden />
              </Button>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
