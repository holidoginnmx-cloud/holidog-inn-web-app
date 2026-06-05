"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, TriangleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Combobox, type ComboOption } from "./Combobox";
import { Pills } from "./Pills";
import { SERVICIO_OPTIONS, SERVICIO_LABEL, ESTADO_OPTIONS, ESTADO_LABEL, type Servicio } from "@/lib/labels";
import { hoyISO, addDiasISO, formatFecha } from "@/lib/date";
import { ocupantes, type ResvLite } from "@/lib/ocupacion";
import { formatMoneda } from "@/lib/utils";
import type { Talla } from "@/lib/perro";
import { calcularPrecioSugerido, type Tarifas } from "@/lib/tarifas";
import { crearReservacion, actualizarReservacion } from "@/app/(dashboard)/reservaciones/actions";

const SERVICIO_PILLS = SERVICIO_OPTIONS.map((s) => ({ value: s, label: SERVICIO_LABEL[s] }));
const ESTADO_PILLS = ESTADO_OPTIONS.map((s) => ({ value: s, label: ESTADO_LABEL[s] }));

export type ReservacionInitial = {
  perroId: string;
  servicio: string;
  fecha_inicio: string;
  fecha_fin: string;
  hora_check_in: string;
  hora_check_out: string;
  precio_acordado: string;
  anticipo_acordado: string;
  estado: string;
  notas: string;
};

type Props = {
  perros: ComboOption[];
  reservacionesActivas: ResvLite[];
  cupo: number;
  pesoPorPerro: Record<string, number | null>;
  tallaPorPerro: Record<string, Talla | null>;
  tarifas: Tarifas;
} & (
  | { mode: "crear"; initialPerroId?: string }
  | { mode: "editar"; reservacionId: string; initial: ReservacionInitial }
);

export function ReservacionForm(props: Props) {
  const router = useRouter();
  const init = props.mode === "editar" ? props.initial : null;

  const [perroId, setPerroId] = useState<string | null>(
    init?.perroId ?? (props.mode === "crear" ? (props.initialPerroId ?? null) : null),
  );
  const [servicio, setServicio] = useState<string>(init?.servicio ?? "HOTEL");
  const [fechaInicio, setFechaInicio] = useState(init?.fecha_inicio ?? hoyISO());
  const [fechaFin, setFechaFin] = useState(init?.fecha_fin || hoyISO());
  const [horaCheckIn, setHoraCheckIn] = useState(init?.hora_check_in ?? "");
  const [horaCheckOut, setHoraCheckOut] = useState(init?.hora_check_out ?? "");
  const [precio, setPrecio] = useState(init?.precio_acordado ?? "");
  const [anticipo, setAnticipo] = useState(init?.anticipo_acordado ?? "");
  const [estado, setEstado] = useState<string>(init?.estado ?? "RESERVADA");
  const [notas, setNotas] = useState(init?.notas ?? "");
  const [probarf, setProbarf] = useState(false);
  // En editar no pisamos el precio guardado; en crear arrancamos con la sugerencia.
  const [precioTocado, setPrecioTocado] = useState(props.mode === "editar");
  const [pending, setPending] = useState(false);

  const esHotel = servicio === "HOTEL";
  const excludeId = props.mode === "editar" ? props.reservacionId : undefined;

  // Precio sugerido según servicio + peso del perro (hotel: × noches; ProBarf abarata).
  const sugerido = useMemo(
    () =>
      calcularPrecioSugerido({
        servicio: servicio as Servicio,
        pesoKg: perroId ? props.pesoPorPerro[perroId] : null,
        talla: perroId ? props.tallaPorPerro[perroId] : null,
        fechaInicio,
        fechaFin: esHotel ? fechaFin : null,
        probarf,
        tarifas: props.tarifas,
      }),
    [
      servicio,
      perroId,
      fechaInicio,
      fechaFin,
      esHotel,
      probarf,
      props.pesoPorPerro,
      props.tallaPorPerro,
      props.tarifas,
    ],
  );

  // Valor mostrado en el input: mientras el usuario no lo edite a mano, sigue a la
  // sugerencia (estado derivado, sin efecto). Al editar, manda lo que escribió.
  const precioEfectivo = !precioTocado && sugerido ? String(sugerido.monto) : precio;

  // Días del rango cuyo cupo se excede con esta reservación (solo HOTEL).
  const conflictos = useMemo(() => {
    if (!esHotel || !fechaInicio || !fechaFin || fechaFin < fechaInicio) return [];
    const out: { dia: string; total: number }[] = [];
    let dia = fechaInicio;
    let guard = 0;
    while (dia <= fechaFin && guard < 366) {
      const total = ocupantes(props.reservacionesActivas, dia, excludeId).length + 1;
      if (total > props.cupo) out.push({ dia, total });
      dia = addDiasISO(dia, 1);
      guard++;
    }
    return out;
  }, [esHotel, fechaInicio, fechaFin, props.reservacionesActivas, props.cupo, excludeId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!perroId) {
      toast.error("Selecciona un perro");
      return;
    }
    setPending(true);
    const input = {
      perro_id: perroId,
      servicio,
      fecha_inicio: fechaInicio,
      fecha_fin: esHotel ? fechaFin : null,
      hora_check_in: horaCheckIn,
      hora_check_out: horaCheckOut,
      precio_acordado: precioEfectivo === "" ? "0" : precioEfectivo,
      anticipo_acordado: anticipo,
      estado,
      notas,
    };
    const res =
      props.mode === "crear"
        ? await crearReservacion(input)
        : await actualizarReservacion(props.reservacionId, input);
    setPending(false);

    if (res.ok) {
      toast.success(props.mode === "crear" ? "Reservación creada" : "Reservación actualizada");
      router.push("/reservaciones");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label>Perro *</Label>
        <Combobox
          options={props.perros}
          value={perroId}
          onChange={setPerroId}
          placeholder="Selecciona un perro"
          searchPlaceholder="Buscar perro o cliente…"
          emptyText="Sin perros"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Servicio *</Label>
        <Pills
          options={SERVICIO_PILLS}
          value={servicio}
          onChange={setServicio}
          ariaLabel="Servicio"
        />
      </div>

      <div className={esHotel ? "grid grid-cols-2 gap-3" : ""}>
        <div className="space-y-1.5">
          <Label htmlFor="resv-inicio">{esHotel ? "Entrada" : "Fecha"}</Label>
          <Input
            id="resv-inicio"
            type="date"
            className="bg-white"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
        </div>
        {esHotel && (
          <div className="space-y-1.5">
            <Label htmlFor="resv-fin">Salida</Label>
            <Input
              id="resv-fin"
              type="date"
              min={fechaInicio}
              className="bg-white"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="resv-hora-in">{esHotel ? "Hora de entrada" : "Hora de llegada"}</Label>
          <Input
            id="resv-hora-in"
            type="time"
            className="bg-white"
            value={horaCheckIn}
            onChange={(e) => setHoraCheckIn(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="resv-hora-out">Hora de salida</Label>
          <Input
            id="resv-hora-out"
            type="time"
            className="bg-white"
            value={horaCheckOut}
            onChange={(e) => setHoraCheckOut(e.target.value)}
          />
        </div>
      </div>

      {conflictos.length > 0 && (
        <div className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <TriangleAlert className="size-5 shrink-0 text-amber-600" aria-hidden />
          <div>
            <p className="font-medium">
              El cupo ({props.cupo}) se excede en {conflictos.length}
            </p>
            <p className="text-amber-800">
              {conflictos.length === 1 ? "día" : "días"}:{" "}
              {conflictos
                .slice(0, 4)
                .map((c) => `${formatFecha(c.dia)} (${c.total})`)
                .join(", ")}
              {conflictos.length > 4 ? "…" : ""}. Puedes guardar de todos modos.
            </p>
          </div>
        </div>
      )}

      {esHotel && (
        <label
          htmlFor="resv-probarf"
          className="flex items-center justify-between rounded-md border border-neutral-border bg-white p-3"
        >
          <span className="text-sm">
            <span className="font-medium text-neutral-ink">ProBarf</span>
            <span className="block text-xs text-neutral-muted">
              Cliente ProBarf (incluye alimento, precio especial)
            </span>
          </span>
          <Switch id="resv-probarf" checked={probarf} onCheckedChange={setProbarf} />
        </label>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="resv-precio">Precio acordado</Label>
          <Input
            id="resv-precio"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="bg-white"
            value={precioEfectivo}
            onChange={(e) => {
              setPrecioTocado(true);
              setPrecio(e.target.value);
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="resv-anticipo">Anticipo (opcional)</Label>
          <Input
            id="resv-anticipo"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="bg-white"
            value={anticipo}
            onChange={(e) => setAnticipo(e.target.value)}
          />
        </div>
      </div>

      {props.mode === "crear" && Number(anticipo) > 0 && (
        <p className="-mt-2 text-xs text-neutral-muted">
          Se registrará como un pago de anticipo y se restará del saldo.
        </p>
      )}

      {servicio !== "GUARDERIA" &&
        (sugerido ? (
          <p className="-mt-2 text-xs text-neutral-muted">
            Sugerido:{" "}
            <span className="font-medium text-brand-teal">{formatMoneda(sugerido.monto)}</span> —{" "}
            {sugerido.detalle}.
            {precioTocado && (
              <button
                type="button"
                className="ml-1 font-medium text-brand-teal underline"
                onClick={() => setPrecioTocado(false)}
              >
                Usar sugerido
              </button>
            )}
          </p>
        ) : (
          perroId &&
          props.pesoPorPerro[perroId] == null &&
          props.tallaPorPerro[perroId] == null && (
            <p className="-mt-2 text-xs text-neutral-muted">
              Registra el peso o la talla del perro para sugerir el precio.
            </p>
          )
        ))}

      <div className="space-y-1.5">
        <Label>Estado</Label>
        <Pills options={ESTADO_PILLS} value={estado} onChange={setEstado} ariaLabel="Estado" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="resv-notas">Notas</Label>
        <Textarea
          id="resv-notas"
          rows={2}
          className="bg-white"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={pending} className="h-12 w-full text-base">
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {props.mode === "crear" ? "Crear reservación" : "Guardar cambios"}
      </Button>
    </form>
  );
}
