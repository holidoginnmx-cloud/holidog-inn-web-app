"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star, Trash2, Upload } from "lucide-react";
import {
  agregarImagen,
  eliminarImagen,
  marcarImagenPrincipal,
} from "@/app/(dashboard)/tienda/actions";
import { comprimirImagen } from "@/lib/image";
import { Button } from "@/components/ui/button";

export type ImagenInicial = {
  id: string;
  url: string;
  isPrimary: boolean;
};

export function ImagenesEditor({
  productoId,
  imagenes,
}: {
  productoId: string;
  imagenes: ImagenInicial[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendo(true);
    const fd = new FormData();
    fd.set("imagen", await comprimirImagen(file));
    const res = await agregarImagen(productoId, fd);
    if (res.ok) {
      toast.success("Imagen subida.");
      router.refresh();
    } else {
      toast.error(res.error);
    }
    setSubiendo(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function onPrimary(id: string) {
    const res = await marcarImagenPrincipal(productoId, id);
    if (res.ok) router.refresh();
    else toast.error(res.error);
  }

  async function onDelete(id: string) {
    if (!confirm("¿Eliminar esta imagen?")) return;
    const res = await eliminarImagen(productoId, id);
    if (res.ok) {
      toast.success("Imagen eliminada.");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {imagenes.map((img) => (
          <div
            key={img.id}
            className="border-neutral-border group relative aspect-square overflow-hidden rounded-lg border bg-white"
          >
            <Image src={img.url} alt="" fill sizes="160px" className="object-cover" />
            {img.isPrimary && (
              <span className="bg-brand-mustard absolute left-1 top-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white">
                Principal
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-black/40 p-1 opacity-0 transition-opacity group-hover:opacity-100">
              {!img.isPrimary && (
                <button
                  type="button"
                  onClick={() => onPrimary(img.id)}
                  title="Marcar principal"
                  className="text-white"
                >
                  <Star className="size-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onDelete(img.id)}
                title="Eliminar"
                className="ml-auto text-white"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onFile}
        className="hidden"
        disabled={subiendo}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={subiendo}
        className="gap-1.5"
      >
        <Upload className="size-4" /> {subiendo ? "Subiendo…" : "Subir imagen"}
      </Button>
    </div>
  );
}
