"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, LogIn, LogOut, Scissors, X } from "lucide-react";
import { cn, focusRing } from "@/lib/utils";
import { Pills } from "./Pills";
import {
  ocupantes,
  serviciosDia,
  nivelOcupacion,
  NIVEL_BARRA,
  NIVEL_CELDA,
  type ResvLite,
} from "@/lib/ocupacion";
import {
  addDiasISO,
  diaDelMes,
  diaSemanaCorto,
  diaSemanaLargo,
  etiquetaMesAnio,
  formatFecha,
} from "@/lib/date";
import { SERVICIO_LABEL, ESTADO_LABEL } from "@/lib/labels";

type Vista = "hoy" | "semana" | "mes";
const VISTA_PILLS = [
  { value: "hoy", label: "Hoy" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mes" },
];

const DIAS_HEADER = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];
const pad = (n: number) => String(n).padStart(2, "0");

export function ReservacionesCalendar({
  reservaciones,
  cupo,
  todayISO,
}: {
  reservaciones: ResvLite[];
  cupo: number;
  todayISO: string;
}) {
  const [vista, setVista] = useState<Vista>("hoy");

  const occ = (iso: string) => ocupantes(reservaciones, iso);
  const serv = (iso: string) => serviciosDia(reservaciones, iso);

  return (
    <div className="space-y-4">
      <Pills
        options={VISTA_PILLS}
        value={vista}
        onChange={(v) => setVista(v as Vista)}
        ariaLabel="Vista"
      />

      {vista === "hoy" && (
        <VistaHoy
          occ={occ}
          serv={serv}
          cupo={cupo}
          todayISO={todayISO}
          reservaciones={reservaciones}
        />
      )}
      {vista === "semana" && <VistaSemana occ={occ} serv={serv} cupo={cupo} todayISO={todayISO} />}
      {vista === "mes" && <VistaMes occ={occ} serv={serv} cupo={cupo} todayISO={todayISO} />}
    </div>
  );
}

// ---------------------------------------------------------------- Barra
function Barra({ count, cupo }: { count: number; cupo: number }) {
  const pct = cupo > 0 ? Math.min(100, (count / cupo) * 100) : 0;
  const nivel = nivelOcupacion(count, cupo);
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-sand">
      <div className={cn("h-full rounded-full", NIVEL_BARRA[nivel])} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ---------------------------------------------------------------- Fila reservación
function FilaResv({ r }: { r: ResvLite }) {
  return (
    <li>
      <Link
        href={`/reservaciones/${r.id}/editar`}
        className="flex items-center justify-between gap-2 rounded-lg border border-neutral-border bg-white p-3 active:bg-neutral-sand/60"
      >
        <div className="min-w-0">
          <p className="truncate font-medium text-neutral-ink">{r.perroNombre ?? "Sin perro"}</p>
          <p className="truncate text-xs text-neutral-muted">
            {SERVICIO_LABEL[r.servicio]} · {formatFecha(r.fecha_inicio)}
            {r.fecha_fin ? ` – ${formatFecha(r.fecha_fin)}` : ""}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-neutral-sand px-2 py-0.5 text-xs text-neutral-muted">
          {ESTADO_LABEL[r.estado]}
        </span>
      </Link>
    </li>
  );
}

function ListaVacia({ texto }: { texto: string }) {
  return (
    <p className="rounded-lg border border-dashed border-neutral-border p-4 text-center text-sm text-neutral-muted">
      {texto}
    </p>
  );
}

// Sección de servicios de día (Estética / Guardería) de una fecha.
// Solo se renderiza si hay alguno; el hotel manda en el cupo.
function ServiciosSection({ lista }: { lista: ResvLite[] }) {
  if (lista.length === 0) return null;
  return (
    <section className="space-y-2">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-brand-mustard">
        <Scissors className="size-4" aria-hidden /> Estética / Guardería
      </h2>
      <ul className="space-y-2">
        {lista.map((r) => (
          <FilaResv key={r.id} r={r} />
        ))}
      </ul>
    </section>
  );
}

// Leyenda de colores de ocupación + indicador de servicios de día.
function LeyendaOcupacion() {
  return (
    <div className="space-y-2 text-xs text-neutral-muted">
      {/* Qué significa cada número de la celda. */}
      <p className="leading-relaxed">
        <span className="font-semibold text-neutral-ink">Esquina:</span> día del mes ·{" "}
        <span className="font-semibold text-neutral-ink">número grande:</span> perros en hotel ese
        día
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-sm bg-emerald-100 ring-1 ring-emerald-300" aria-hidden />
        Libre
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-sm bg-amber-100 ring-1 ring-amber-300" aria-hidden />
        Medio
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-sm bg-rose-100 ring-1 ring-rose-300" aria-hidden />
        Lleno
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-brand-mustard" aria-hidden />
        Estética / Guardería
      </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Hoy
function VistaHoy({
  occ,
  serv,
  cupo,
  todayISO,
  reservaciones,
}: {
  occ: (iso: string) => ResvLite[];
  serv: (iso: string) => ResvLite[];
  cupo: number;
  todayISO: string;
  reservaciones: ResvLite[];
}) {
  const hospedados = occ(todayISO);
  const checkIns = reservaciones.filter(
    (r) => r.servicio === "HOTEL" && r.fecha_inicio === todayISO,
  );
  const checkOuts = reservaciones.filter(
    (r) => r.servicio === "HOTEL" && (r.fecha_fin ?? r.fecha_inicio) === todayISO,
  );

  return (
    <div className="space-y-5">
      {/* Cupo */}
      <div className="rounded-xl border border-neutral-border bg-white p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-sm text-neutral-muted">Ocupación del hotel</p>
          <p className="text-2xl font-bold tracking-tight text-neutral-ink">
            {hospedados.length}{" "}
            <span className="text-base font-normal text-neutral-muted">/ {cupo}</span>
          </p>
        </div>
        <div className="mt-3">
          <Barra count={hospedados.length} cupo={cupo} />
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-neutral-muted">Hospedados ahora (hotel)</h2>
        {hospedados.length === 0 ? (
          <ListaVacia texto="Ningún perro hospedado hoy." />
        ) : (
          <ul className="space-y-2">
            {hospedados.map((r) => (
              <FilaResv key={r.id} r={r} />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-neutral-muted">
          <LogIn className="size-4" aria-hidden /> Check-ins de hoy
        </h2>
        {checkIns.length === 0 ? (
          <ListaVacia texto="Sin entradas hoy." />
        ) : (
          <ul className="space-y-2">
            {checkIns.map((r) => (
              <FilaResv key={r.id} r={r} />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-neutral-muted">
          <LogOut className="size-4" aria-hidden /> Check-outs de hoy
        </h2>
        {checkOuts.length === 0 ? (
          <ListaVacia texto="Sin salidas hoy." />
        ) : (
          <ul className="space-y-2">
            {checkOuts.map((r) => (
              <FilaResv key={r.id} r={r} />
            ))}
          </ul>
        )}
      </section>

      <ServiciosSection lista={serv(todayISO)} />
    </div>
  );
}

// ---------------------------------------------------------------- Detalle de un día
function DetalleDia({
  iso,
  occ,
  serv,
  sinEncabezado = false,
}: {
  iso: string;
  occ: (iso: string) => ResvLite[];
  serv: (iso: string) => ResvLite[];
  sinEncabezado?: boolean;
}) {
  const lista = occ(iso);
  return (
    <div className="space-y-4">
      <section className="space-y-2">
        {!sinEncabezado && (
          <h2 className="text-sm font-semibold text-brand-teal">
            <span className="capitalize">{diaSemanaLargo(iso)}</span> {formatFecha(iso)}
          </h2>
        )}
        {lista.length === 0 ? (
          <ListaVacia texto="Ningún perro hospedado este día." />
        ) : (
          <ul className="space-y-2">
            {lista.map((r) => (
              <FilaResv key={r.id} r={r} />
            ))}
          </ul>
        )}
      </section>

      <ServiciosSection lista={serv(iso)} />
    </div>
  );
}

// ---------------------------------------------------------------- Semana
function lunesDeLaSemana(iso: string): string {
  const dow = new Date(`${iso}T00:00:00`).getDay(); // 0 dom .. 6 sáb
  return addDiasISO(iso, dow === 0 ? -6 : 1 - dow);
}

function VistaSemana({
  occ,
  serv,
  cupo,
  todayISO,
}: {
  occ: (iso: string) => ResvLite[];
  serv: (iso: string) => ResvLite[];
  cupo: number;
  todayISO: string;
}) {
  const [inicio, setInicio] = useState(() => lunesDeLaSemana(todayISO));
  const [sel, setSel] = useState(todayISO);

  const dias = useMemo(() => Array.from({ length: 7 }, (_, i) => addDiasISO(inicio, i)), [inicio]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Semana anterior"
          onClick={() => setInicio(addDiasISO(inicio, -7))}
          className={cn(
            "flex size-11 items-center justify-center rounded-md text-neutral-muted hover:bg-neutral-sand",
            focusRing,
          )}
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <p className="text-sm font-medium text-neutral-ink">
          {formatFecha(dias[0])} – {formatFecha(dias[6])}
        </p>
        <button
          type="button"
          aria-label="Semana siguiente"
          onClick={() => setInicio(addDiasISO(inicio, 7))}
          className={cn(
            "flex size-11 items-center justify-center rounded-md text-neutral-muted hover:bg-neutral-sand",
            focusRing,
          )}
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {dias.map((iso) => {
          const count = occ(iso).length;
          const tieneServ = serv(iso).length > 0;
          const activo = iso === sel;
          const esHoy = iso === todayISO;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => setSel(iso)}
              className={cn(
                "flex w-20 shrink-0 flex-col items-center gap-1 rounded-xl border p-2 transition-colors",
                focusRing,
                activo ? "border-brand-teal bg-brand-teal/10" : "border-neutral-border bg-white",
              )}
            >
              <span className="text-xs capitalize text-neutral-muted">{diaSemanaCorto(iso)}</span>
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-sm font-semibold",
                  esHoy ? "bg-brand-teal text-white" : "text-neutral-ink",
                )}
              >
                {diaDelMes(iso)}
              </span>
              <span className="text-lg font-bold text-neutral-ink">{count}</span>
              <Barra count={count} cupo={cupo} />
              <span
                className={cn("size-2.5 rounded-full", tieneServ ? "bg-brand-mustard" : "bg-transparent")}
                aria-hidden
              />
            </button>
          );
        })}
      </div>

      <DetalleDia iso={sel} occ={occ} serv={serv} />
    </div>
  );
}

// ---------------------------------------------------------------- Mes
function VistaMes({
  occ,
  serv,
  cupo,
  todayISO,
}: {
  occ: (iso: string) => ResvLite[];
  serv: (iso: string) => ResvLite[];
  cupo: number;
  todayISO: string;
}) {
  const [anio, setAnio] = useState(() => Number(todayISO.slice(0, 4)));
  const [mes, setMes] = useState(() => Number(todayISO.slice(5, 7))); // 1-12
  const [sel, setSel] = useState<string | null>(null);

  const celdas = useMemo(() => {
    const primeroDow = new Date(anio, mes - 1, 1).getDay();
    const numDias = new Date(anio, mes, 0).getDate();
    const out: (string | null)[] = [];
    for (let i = 0; i < primeroDow; i++) out.push(null);
    for (let d = 1; d <= numDias; d++) out.push(`${anio}-${pad(mes)}-${pad(d)}`);
    return out;
  }, [anio, mes]);

  function mover(delta: number) {
    let m = mes + delta;
    let a = anio;
    if (m < 1) {
      m = 12;
      a -= 1;
    } else if (m > 12) {
      m = 1;
      a += 1;
    }
    setMes(m);
    setAnio(a);
    setSel(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Mes anterior"
          onClick={() => mover(-1)}
          className={cn(
            "flex size-11 items-center justify-center rounded-md text-neutral-muted hover:bg-neutral-sand",
            focusRing,
          )}
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <p className="text-sm font-medium capitalize text-neutral-ink">
          {etiquetaMesAnio(anio, mes)}
        </p>
        <button
          type="button"
          aria-label="Mes siguiente"
          onClick={() => mover(1)}
          className={cn(
            "flex size-11 items-center justify-center rounded-md text-neutral-muted hover:bg-neutral-sand",
            focusRing,
          )}
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-muted">
        {DIAS_HEADER.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {celdas.map((iso, i) => {
          if (!iso) return <span key={`b${i}`} />;
          const count = occ(iso).length;
          const tieneServ = serv(iso).length > 0;
          const nivel = nivelOcupacion(count, cupo);
          const esHoy = iso === todayISO;
          const activo = iso === sel;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => setSel(iso)}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-md border transition-colors md:aspect-auto md:h-20",
                focusRing,
                count > 0 ? NIVEL_CELDA[nivel] : "bg-white text-neutral-ink",
                activo ? "border-brand-teal ring-1 ring-brand-teal" : "border-neutral-border",
              )}
            >
              {/* Día del mes: esquina superior izquierda, como un calendario. */}
              <span
                className={cn(
                  "absolute left-1.5 top-1 text-[11px] font-medium leading-none",
                  esHoy
                    ? "flex size-5 -translate-x-0.5 items-center justify-center rounded-full bg-brand-teal font-bold text-white"
                    : "text-neutral-muted",
                )}
              >
                {diaDelMes(iso)}
              </span>

              {/* Indicador de estética / guardería: esquina superior derecha. */}
              {tieneServ && (
                <span
                  className="absolute right-1 top-1 size-3 rounded-full bg-brand-mustard ring-2 ring-white"
                  aria-hidden
                />
              )}

              {/* Perros en hotel ese día (número grande). */}
              {count > 0 ? (
                <span className="text-base font-extrabold tabular-nums md:text-xl">{count}</span>
              ) : (
                <span className="text-sm font-normal text-neutral-muted/40 md:text-base">·</span>
              )}
            </button>
          );
        })}
      </div>

      <LeyendaOcupacion />

      {/* Pop-up con el detalle del día seleccionado. */}
      <Dialog.Root open={sel !== null} onOpenChange={(o) => !o && setSel(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-neutral-cream p-5 shadow-lg focus:outline-none">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <Dialog.Title className="text-base font-semibold capitalize text-brand-teal">
                  {sel ? diaSemanaLargo(sel) : ""}
                </Dialog.Title>
                <Dialog.Description className="text-sm text-neutral-muted">
                  {sel ? formatFecha(sel) : ""}
                  {sel ? ` · ${occ(sel).length} en hotel` : ""}
                </Dialog.Description>
              </div>
              <Dialog.Close
                aria-label="Cerrar"
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full text-neutral-muted hover:bg-neutral-sand",
                  focusRing,
                )}
              >
                <X className="size-5" aria-hidden />
              </Dialog.Close>
            </div>
            {sel && <DetalleDia iso={sel} occ={occ} serv={serv} sinEncabezado />}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
