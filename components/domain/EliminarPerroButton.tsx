"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "./ConfirmButton";
import { eliminarPerro } from "@/app/(dashboard)/perros/actions";

export function EliminarPerroButton({ perroId, nombre }: { perroId: string; nombre: string }) {
  const router = useRouter();
  return (
    <ConfirmButton
      title={`¿Eliminar a ${nombre}?`}
      description="Se borrarán también sus reservaciones y pagos. Esta acción no se puede deshacer."
      confirmLabel="Eliminar perro"
      trigger={
        <Button variant="outline" className="text-destructive w-full">
          <Trash2 className="size-4" aria-hidden />
          Eliminar perro
        </Button>
      }
      onConfirm={async () => {
        const res = await eliminarPerro(perroId);
        if (res.ok) {
          toast.success("Perro eliminado");
          router.push("/perros");
          router.refresh();
        } else {
          toast.error(res.error);
          throw new Error(res.error);
        }
      }}
    />
  );
}
