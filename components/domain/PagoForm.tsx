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
  SERVICIO_OPTIONS,
  SERVICIO_LABEL,
  PAGO_TIPO_OPTIONS,
  PAGO_TIPO_LABEL,
  ESTADO_LABEL,
  type Servicio,
  type PagoTipo,
} from "@/lib/labels";
import { formatFecha, hoyISO } from "@/lib/date";
import { formatMoneda } from "@/lib/utils";
import { estadoPago } from "@/lib/reservacion";
import {
  crearPago,
  actualizarPago,
  getReservacionesDelPerro,
  type ReservacionAbierta,
} from "@/app/(dashboard)/movimientos/actions";

export type PagoEditable = {
  pagoId: string;
  perroNombre: string | null;
  servicio: Servicio | null;
  monto: number;
  tipo: PagoTipo;
  fecha: string;
  notas: string | null;
};

const SERVICIO_PILLS = SERVICIO_OPTIONS.map((s) => ({ value: s, label: SERVICIO_LABEL[s] }));
const TIPO_PILLS = PAGO_TIPO_OPTIONS.map((t) => ({ value: t, label: PAGO_TIPO_LABEL[t] }));

const selectClass =
  "flex h-11 w-full rounded-md border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function PagoForm({
  perros,
  editar,
  onDone,
}: {
  perros: ComboOption[];
  editar?: PagoEditable;
  onDone?: () => void;
}) {
  const router = useRouter();
  const esEdicion = editar != null;

  const [perroId, setPerroId] = useState<string | null>(null);
  const [reservaciones, setReservaciones] = useState<ReservacionAbierta[]>([]);
  const [loadingResv, setLoadingResv] = useState(false);
  const [reservacionId, setReservacionId] = useState("nueva");
  const [servicio, setServicio] = useState<string | null>(null);
  const [monto, setMonto] = useState(editar ? String(editar.monto) : "");
  const [tipo, setTipo] = useState<string>(editar?.tipo ?? "ABONO");
  const [fecha, setFecha] = useState(editar?.fecha ?? hoyISO());
  const [notas, setNotas] = useState(editar?.notas ?? "");
  const [pending, setPending] = useState(false);

  async function onPerroChange(id: string) {
    setPerroId(id);
    setReservacionId("nueva");
    setReservaciones([]);
    setLoadingResv(true);
    const res = await getReservacionesDelPerro(id);
    if (res.ok) setReservaciones(res.data);
    setLoadingResv(false);
  }

  function reset() {
    setPerroId(null);
    setReservaciones([]);
    setReservacionId("nueva");
    setServicio(null);
    setMonto("");
    setTipo("ABONO");
    setFecha(hoyISO());
    setNotas("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (esEdicion) {
      setPending(true);
      const res = await actualizarPago(editar.pagoId, { monto, tipo, fecha, notas });
      setPending(false);
      if (res.ok) {
        toast.success("Ingreso actualizado");
        onDone?.();
        router.refresh();
      } else {
        toast.error(res.error);
      }
      return;
    }

    if (!perroId) {
      toast.error("Selecciona un perro");
      return;
    }
    setPending(true);
    const res = await crearPago({
      perro_id: perroId,
      reservacion_id: reservacionId,
      servicio: reservacionId === "nueva" ? servicio : null,
      monto,
      tipo,
      fecha,
      notas,
    });
    setPending(false);

    if (res.ok) {
      toast.success("Ingreso guardado");
      reset();
      onDone?.();
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {esEdicion ? (
        <div className="rounded-md border border-neutral-border bg-neutral-sand/40 px-3 py-2 text-sm">
          <span className="text-neutral-muted">Perro: </span>
          <span className="font-medium text-neutral-ink">{editar.perroNombre ?? "Sin perro"}</span>
          {editar.servicio && (
            <span className="text-neutral-muted"> · {SERVICIO_LABEL[editar.servicio]}</span>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            <Label>Perro *</Label>
            <Combobox
              options={perros}
              value={perroId}
              onChange={onPerroChange}
              placeholder="Selecciona un perro"
              searchPlaceholder="Buscar perro o cliente…"
              emptyText="Sin perros"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pago-reservacion">Reservación</Label>
            <select
              id="pago-reservacion"
              className={selectClass}
              value={reservacionId}
              onChange={(e) => setReservacionId(e.target.value)}
              disabled={!perroId || loadingResv}
            >
              <option value="nueva">➕ Crear nueva reservación con este pago</option>
              {reservaciones.map((r) => {
                const ep = estadoPago(r.precio_acordado, r.pagado);
                const saldoTxt =
                  ep.key === "PENDIENTE"
                    ? ` · faltan ${formatMoneda(ep.saldo)}`
                    : ep.key === "PAGADA" || ep.key === "SALDO_FAVOR"
                      ? " · pagada"
                      : "";
                return (
                  <option key={r.id} value={r.id}>
                    {SERVICIO_LABEL[r.servicio]} · {formatFecha(r.fecha_inicio)} ·{" "}
                    {ESTADO_LABEL[r.estado]}
                    {saldoTxt}
                  </option>
                );
              })}
            </select>
            {loadingResv && <p className="text-xs text-neutral-muted">Cargando reservaciones…</p>}
          </div>

          {reservacionId === "nueva" && (
            <div className="space-y-1.5">
              <Label>Servicio *</Label>
              <Pills
                options={SERVICIO_PILLS}
                value={servicio}
                onChange={setServicio}
                ariaLabel="Servicio"
              />
            </div>
          )}
        </>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="pago-monto">Monto *</Label>
        <Input
          id="pago-monto"
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
        <Label>Tipo</Label>
        <Pills options={TIPO_PILLS} value={tipo} onChange={setTipo} ariaLabel="Tipo de pago" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pago-fecha">Fecha</Label>
        <Input
          id="pago-fecha"
          type="date"
          className="bg-white"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pago-notas">Notas</Label>
        <Textarea
          id="pago-notas"
          rows={2}
          className="bg-white"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="h-12 w-full bg-brand-ingreso text-base hover:bg-brand-ingreso/90"
      >
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {esEdicion ? "Guardar cambios" : "Guardar ingreso"}
      </Button>
    </form>
  );
}
