"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboOption } from "./Combobox";
import { Pills } from "./Pills";
import {
  TIPO_COSTO_OPTIONS,
  TIPO_COSTO_LABEL,
  tipoCostoSugerido,
  type TipoCosto,
} from "@/lib/labels";
import { hoyISO } from "@/lib/date";
import { crearEgreso, actualizarEgreso } from "@/app/(dashboard)/movimientos/actions";

const TIPO_COSTO_PILLS = TIPO_COSTO_OPTIONS.map((t) => ({ value: t, label: TIPO_COSTO_LABEL[t] }));

export type EgresoEditable = {
  egresoId: string;
  descripcion: string;
  monto: number;
  categoria: string;
  tipo_costo: TipoCosto;
  fecha: string;
  notas: string | null;
};

export function EgresoForm({
  categorias,
  editar,
  onDone,
}: {
  categorias: string[];
  editar?: EgresoEditable;
  onDone?: () => void;
}) {
  const router = useRouter();
  const esEdicion = editar != null;

  const opcionesCategoria: ComboOption[] = categorias.map((c) => ({ value: c, label: c }));

  const [descripcion, setDescripcion] = useState(editar?.descripcion ?? "");
  const [monto, setMonto] = useState(editar ? String(editar.monto) : "");
  const [categoria, setCategoria] = useState<string | null>(editar?.categoria ?? null);
  const [tipoCosto, setTipoCosto] = useState<string | null>(editar?.tipo_costo ?? null);
  const [fecha, setFecha] = useState(editar?.fecha ?? hoyISO());
  const [notas, setNotas] = useState(editar?.notas ?? "");
  const [pending, setPending] = useState(false);

  function onCategoriaChange(value: string | null) {
    setCategoria(value);
    const sugerido = tipoCostoSugerido(value);
    if (sugerido) setTipoCosto(sugerido);
  }

  function reset() {
    setDescripcion("");
    setMonto("");
    setCategoria(null);
    setTipoCosto(null);
    setFecha(hoyISO());
    setNotas("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tipoCosto) {
      toast.error("Selecciona el tipo de costo");
      return;
    }
    const payload = {
      descripcion,
      monto,
      categoria: categoria ?? "",
      tipo_costo: tipoCosto,
      fecha,
      notas,
    };
    setPending(true);
    const res = esEdicion
      ? await actualizarEgreso(editar.egresoId, payload)
      : await crearEgreso(payload);
    setPending(false);

    if (res.ok) {
      toast.success(esEdicion ? "Egreso actualizado" : "Egreso guardado");
      reset();
      onDone?.();
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="egreso-desc">Descripción *</Label>
        <Input
          id="egreso-desc"
          className="bg-white"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="egreso-monto">Monto *</Label>
        <Input
          id="egreso-monto"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0.00"
          className="h-12 bg-white text-lg"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Categoría *</Label>
        <Combobox
          options={opcionesCategoria}
          value={categoria}
          onChange={onCategoriaChange}
          placeholder="Selecciona o escribe una categoría"
          searchPlaceholder="Buscar o nueva categoría…"
          emptyText="Escribe para crear una nueva"
          allowCustom
        />
      </div>

      <div className="space-y-1.5">
        <Label>Tipo de costo *</Label>
        <Pills
          options={TIPO_COSTO_PILLS}
          value={tipoCosto}
          onChange={setTipoCosto}
          ariaLabel="Tipo de costo"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="egreso-fecha">Fecha</Label>
        <Input
          id="egreso-fecha"
          type="date"
          className="bg-white"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="egreso-notas">Notas</Label>
        <Textarea
          id="egreso-notas"
          rows={2}
          className="bg-white"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="h-12 w-full bg-brand-egreso text-base hover:bg-brand-egreso/90"
      >
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {esEdicion ? "Guardar cambios" : "Guardar egreso"}
      </Button>
    </form>
  );
}
