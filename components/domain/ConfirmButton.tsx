"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Botón que pide confirmación antes de ejecutar una acción destructiva.
// `onConfirm` debe encargarse de su propio toast/navegación; aquí solo
// manejamos el diálogo y el estado de carga.
export function ConfirmButton({
  trigger,
  title,
  description,
  confirmLabel = "Eliminar",
  destructive = true,
  onConfirm,
}: {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function run() {
    setPending(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch {
      // onConfirm muestra su propio toast de error; dejamos el diálogo abierto.
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-5 shadow-lg focus:outline-none">
          <Dialog.Title className="text-lg font-semibold text-neutral-ink">{title}</Dialog.Title>
          {description && (
            <Dialog.Description className="mt-1 text-sm text-neutral-muted">
              {description}
            </Dialog.Description>
          )}
          <div className="mt-5 flex gap-3">
            <Dialog.Close asChild>
              <Button variant="outline" className="flex-1" disabled={pending}>
                Cancelar
              </Button>
            </Dialog.Close>
            <Button
              onClick={run}
              disabled={pending}
              className={cn(
                "flex-1",
                destructive && "bg-destructive hover:bg-destructive/90 text-white",
              )}
            >
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
