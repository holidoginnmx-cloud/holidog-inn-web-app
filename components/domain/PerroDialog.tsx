"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn, focusRing } from "@/lib/utils";
import { PerroCard, type PerroListItem } from "./PerroCard";
import { PerroDetalleContenido } from "./PerroDetalleContenido";

// Tarjeta de la lista que, al tocarla, abre un pop-up con la ficha del perro
// (en vez de navegar a otra pantalla). El detalle se carga bajo demanda al
// abrir, así la lista se mantiene ligera.
export function PerroDialog({ perro }: { perro: PerroListItem }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={cn("group block w-full rounded-xl text-left", focusRing)}
        >
          <PerroCard perro={perro} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-neutral-cream p-5 shadow-lg focus:outline-none">
          {/* Montamos el contenido solo cuando está abierto: dispara el fetch
              al abrir y muestra siempre datos frescos. */}
          {open && <PerroDetalleContenido perroId={perro.id} onClose={() => setOpen(false)} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
