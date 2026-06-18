"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { guardarEnvioConfig } from "@/app/(dashboard)/tienda/actions";

// Tarifa plana del envío nacional. Vacío = desactivado (el checkout no ofrece
// envío nacional). El cobro real lo aplica la API server-side.
export function EnvioConfigForm({ fee }: { fee: number | null }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const res = await guardarEnvioConfig(new FormData(e.currentTarget));
    if (res.ok) {
      toast.success("Tarifa de envío guardada.");
      router.refresh();
    } else {
      toast.error(res.error);
    }
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label htmlFor="nationalShippingFee" className="text-neutral-ink block text-sm font-medium">
        Tarifa de envío nacional (MXN)
      </label>
      <div className="flex items-center gap-2">
        <span className="text-neutral-muted">$</span>
        <input
          id="nationalShippingFee"
          name="nationalShippingFee"
          type="number"
          min="0"
          step="0.01"
          defaultValue={fee ?? ""}
          placeholder="Ej. 180"
          className="border-neutral-border h-10 w-40 rounded-md border bg-white px-3 text-sm"
        />
      </div>
      <p className="text-neutral-muted text-xs">
        Déjalo vacío para <strong>desactivar</strong> el envío nacional en la tienda.
      </p>
      <button
        type="submit"
        disabled={pending}
        className="bg-brand-teal hover:bg-brand-teal/90 h-10 rounded-md px-5 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
