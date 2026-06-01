"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "./ConfirmButton";
import { eliminarReservacion } from "@/app/(dashboard)/reservaciones/actions";

export function EliminarReservacionButton({ reservacionId }: { reservacionId: string }) {
  const router = useRouter();
  return (
    <ConfirmButton
      title="¿Eliminar esta reservación?"
      description="Se borrarán también sus pagos asociados. Esta acción no se puede deshacer."
      confirmLabel="Eliminar reservación"
      trigger={
        <Button variant="outline" className="text-destructive w-full">
          <Trash2 className="size-4" aria-hidden />
          Eliminar reservación
        </Button>
      }
      onConfirm={async () => {
        const res = await eliminarReservacion(reservacionId);
        if (res.ok) {
          toast.success("Reservación eliminada");
          router.push("/reservaciones");
          router.refresh();
        } else {
          toast.error(res.error);
          throw new Error(res.error);
        }
      }}
    />
  );
}
