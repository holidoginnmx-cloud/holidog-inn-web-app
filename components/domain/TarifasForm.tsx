"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SERVICIO_LABEL, type Servicio } from "@/lib/labels";
import { actualizarTarifas } from "@/app/(dashboard)/config/actions";

export type TarifaItem = {
  codigo: string;
  servicio: Servicio;
  etiqueta: string;
  precio: number;
};

export function TarifasForm({ tarifas }: { tarifas: TarifaItem[] }) {
  const router = useRouter();
  const [valores, setValores] = useState<Record<string, string>>(() =>
    Object.fromEntries(tarifas.map((t) => [t.codigo, String(t.precio)])),
  );
  const [pending, setPending] = useState(false);

  const sinCambios = tarifas.every((t) => valores[t.codigo] === String(t.precio));

  // Agrupamos por servicio para mostrar Hotel / Estética por separado.
  const grupos = new Map<Servicio, TarifaItem[]>();
  for (const t of tarifas) {
    const arr = grupos.get(t.servicio) ?? [];
    arr.push(t);
    grupos.set(t.servicio, arr);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await actualizarTarifas({
      tarifas: tarifas.map((t) => ({ codigo: t.codigo, precio: valores[t.codigo] ?? "0" })),
    });
    setPending(false);
    if (res.ok) {
      toast.success("Tarifas guardadas");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-xs text-neutral-muted">
        Precios sugeridos al crear una reservación. El hotel se multiplica por noche. La guardería
        se cobra caso a caso y no se sugiere.
      </p>

      {[...grupos.entries()].map(([servicio, items]) => (
        <div key={servicio} className="space-y-2">
          <h3 className="text-xs font-semibold text-neutral-muted">{SERVICIO_LABEL[servicio]}</h3>
          {items.map((t) => (
            <div key={t.codigo} className="flex items-center gap-3">
              <label htmlFor={`tarifa-${t.codigo}`} className="flex-1 text-sm text-neutral-ink">
                {t.etiqueta}
              </label>
              <Input
                id={`tarifa-${t.codigo}`}
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                className="w-28 bg-white"
                value={valores[t.codigo] ?? ""}
                onChange={(e) =>
                  setValores((v) => ({ ...v, [t.codigo]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>
      ))}

      <Button type="submit" disabled={pending || sinCambios} className="w-full">
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        Guardar tarifas
      </Button>
    </form>
  );
}
