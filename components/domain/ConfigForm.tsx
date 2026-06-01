"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { actualizarConfig } from "@/app/(dashboard)/config/actions";

export function ConfigForm({ nombre, cupo }: { nombre: string; cupo: number }) {
  const router = useRouter();
  const [nombreHotel, setNombreHotel] = useState(nombre);
  const [cupoMaximo, setCupoMaximo] = useState(String(cupo));
  const [pending, setPending] = useState(false);

  const sinCambios = nombreHotel === nombre && cupoMaximo === String(cupo);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await actualizarConfig({ nombre_hotel: nombreHotel, cupo_maximo: cupoMaximo });
    setPending(false);
    if (res.ok) {
      toast.success("Configuración guardada");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-neutral-border bg-white p-4"
    >
      <div className="space-y-1.5">
        <Label htmlFor="cfg-nombre">Nombre del hotel</Label>
        <Input
          id="cfg-nombre"
          className="bg-white"
          value={nombreHotel}
          onChange={(e) => setNombreHotel(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cfg-cupo">Cupo máximo del hotel</Label>
        <Input
          id="cfg-cupo"
          type="number"
          inputMode="numeric"
          min="1"
          className="bg-white"
          value={cupoMaximo}
          onChange={(e) => setCupoMaximo(e.target.value)}
        />
        <p className="text-xs text-neutral-muted">
          Usado en el calendario de reservaciones para calcular disponibilidad.
        </p>
      </div>
      <Button type="submit" disabled={pending || sinCambios} className="w-full">
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        Guardar
      </Button>
    </form>
  );
}
