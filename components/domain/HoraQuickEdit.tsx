"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { actualizarHorasReservacion } from "@/app/(dashboard)/reservaciones/actions";

// Editor rápido de una hora (check-in o check-out) desde el calendario.
// Conoce ambas horas vigentes para reenviar el par completo y no borrar la otra.
export function HoraQuickEdit({
  reservacionId,
  perroId,
  campo,
  label,
  horaCheckIn,
  horaCheckOut,
}: {
  reservacionId: string;
  perroId: string;
  campo: "hora_check_in" | "hora_check_out";
  label: string;
  horaCheckIn: string | null | undefined;
  horaCheckOut: string | null | undefined;
}) {
  const router = useRouter();
  const inicial = (campo === "hora_check_in" ? horaCheckIn : horaCheckOut)?.slice(0, 5) ?? "";
  const [valor, setValor] = useState(inicial);
  const [pending, startTransition] = useTransition();

  function commit() {
    if (valor === inicial) return;
    const payload = {
      hora_check_in: (campo === "hora_check_in" ? valor : (horaCheckIn?.slice(0, 5) ?? "")),
      hora_check_out: (campo === "hora_check_out" ? valor : (horaCheckOut?.slice(0, 5) ?? "")),
    };
    startTransition(async () => {
      const res = await actualizarHorasReservacion(reservacionId, payload, perroId);
      if (res.ok) {
        toast.success("Hora actualizada");
        router.refresh();
      } else {
        toast.error(res.error);
        setValor(inicial);
      }
    });
  }

  return (
    <Input
      type="time"
      aria-label={label}
      className="h-9 w-[7.25rem] shrink-0 bg-white"
      value={valor}
      disabled={pending}
      onChange={(e) => setValor(e.target.value)}
      onBlur={commit}
    />
  );
}
