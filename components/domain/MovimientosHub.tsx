"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, TrendingUp, TrendingDown, Trash2, Wallet, Receipt, ChevronDown } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn, focusRing, formatMoneda } from "@/lib/utils";
import { formatFecha, semanaDelMes, semanasDelMes } from "@/lib/date";
import { useHotkey } from "@/lib/useHotkey";
import {
  SERVICIO_LABEL,
  PAGO_TIPO_LABEL,
  TIPO_COSTO_LABEL,
  type Servicio,
  type PagoTipo,
  type TipoCosto,
} from "@/lib/labels";
import { PagoForm } from "./PagoForm";
import { EgresoForm } from "./EgresoForm";
import { EmptyState } from "./EmptyState";
import { ConfirmButton } from "./ConfirmButton";
import type { ComboOption } from "./Combobox";
import { eliminarPago, eliminarEgreso } from "@/app/(dashboard)/movimientos/actions";

export type IngresoItem = {
  id: string;
  monto: number;
  tipo: PagoTipo;
  fecha: string;
  perroNombre: string | null;
  servicio: Servicio | null;
  descripcion: string | null;
};

export type EgresoItem = {
  id: string;
  fecha: string;
  descripcion: string;
  monto: number;
  categoria: string;
  tipo_costo: TipoCosto;
  notas: string | null;
};

type Editando = { tipo: "pago"; item: IngresoItem } | { tipo: "egreso"; item: EgresoItem } | null;

type Tab = "ingresos" | "egresos";

// Color por semana del mes: borde izquierdo + fondo tenue + chip de leyenda.
// Hasta 6 semanas: azul, verde, amarillo, naranja, rosa, morado.
const SEMANA_ESTILO = [
  { borde: "border-l-blue-400", fondo: "bg-blue-50", chip: "bg-blue-100 text-blue-700" },
  { borde: "border-l-emerald-400", fondo: "bg-emerald-50", chip: "bg-emerald-100 text-emerald-700" },
  { borde: "border-l-amber-400", fondo: "bg-amber-50", chip: "bg-amber-100 text-amber-700" },
  { borde: "border-l-orange-400", fondo: "bg-orange-50", chip: "bg-orange-100 text-orange-700" },
  { borde: "border-l-pink-400", fondo: "bg-pink-50", chip: "bg-pink-100 text-pink-700" },
  { borde: "border-l-violet-400", fondo: "bg-violet-50", chip: "bg-violet-100 text-violet-700" },
] as const;

function estiloSemana(n: number) {
  return SEMANA_ESTILO[(n - 1) % SEMANA_ESTILO.length] ?? SEMANA_ESTILO[0];
}

// Mapa semana → "1–3" para el encabezado de cada grupo.
function rangosSemana(anio: number, mes: number): Map<number, string> {
  const m = new Map<number, string>();
  for (const s of semanasDelMes(anio, mes)) m.set(s.semana, `${s.inicio}–${s.fin}`);
  return m;
}

function agruparPorSemana<T extends { fecha: string; monto: number }>(
  items: T[],
): { semana: number; items: T[] }[] {
  const map = new Map<number, T[]>();
  for (const it of items) {
    const w = semanaDelMes(it.fecha);
    const arr = map.get(w);
    if (arr) arr.push(it);
    else map.set(w, [it]);
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([semana, items]) => ({ semana, items }));
}

export function MovimientosHub({
  ingresos,
  egresos,
  totalIngresosMes,
  totalEgresosMes,
  mesLabel,
  anio,
  mes,
  perros,
  categorias,
}: {
  ingresos: IngresoItem[];
  egresos: EgresoItem[];
  totalIngresosMes: number;
  totalEgresosMes: number;
  mesLabel: string;
  anio: number;
  mes: number;
  perros: ComboOption[];
  categorias: string[];
}) {
  const [tab, setTab] = useState<Tab>("ingresos");
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<Editando>(null);
  const esIngresos = tab === "ingresos";
  const lista = esIngresos ? ingresos : egresos;

  function abrirNuevo() {
    setEditando(null);
    setOpen(true);
  }

  // Atajo: "n" abre la captura de un nuevo movimiento (desktop).
  useHotkey("n", abrirNuevo, !open);

  const tituloSheet = editando
    ? editando.tipo === "pago"
      ? "Editar ingreso"
      : "Editar egreso"
    : esIngresos
      ? "Nuevo ingreso"
      : "Nuevo egreso";

  const descSheet = editando
    ? "Modifica los datos y guarda los cambios."
    : esIngresos
      ? "Registra un pago."
      : "Registra un gasto.";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setTab("ingresos")}
          aria-pressed={esIngresos}
          className={cn(
            "flex h-12 items-center justify-center gap-2 rounded-xl text-base font-semibold transition-colors",
            focusRing,
            esIngresos
              ? "bg-brand-ingreso text-white"
              : "border border-neutral-border bg-white text-neutral-muted",
          )}
        >
          <TrendingUp className="size-5" aria-hidden />
          Ingresos
        </button>
        <button
          type="button"
          onClick={() => setTab("egresos")}
          aria-pressed={!esIngresos}
          className={cn(
            "flex h-12 items-center justify-center gap-2 rounded-xl text-base font-semibold transition-colors",
            focusRing,
            !esIngresos
              ? "bg-brand-egreso text-white"
              : "border border-neutral-border bg-white text-neutral-muted",
          )}
        >
          <TrendingDown className="size-5" aria-hidden />
          Egresos
        </button>
      </div>

      <div className="rounded-xl border border-neutral-border bg-white p-4">
        <p className="text-xs text-neutral-muted">Total del mes</p>
        <p
          className={cn(
            "text-3xl font-bold tracking-tight",
            esIngresos ? "text-brand-ingreso" : "text-brand-egreso",
          )}
        >
          {formatMoneda(esIngresos ? totalIngresosMes : totalEgresosMes)}
        </p>
      </div>

      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold capitalize text-neutral-muted">{mesLabel}</h2>
          <span className="text-xs text-neutral-muted">
            {lista.length} {lista.length === 1 ? "movimiento" : "movimientos"}
          </span>
        </div>
        <ListaPorSemana
          tab={tab}
          ingresos={ingresos}
          egresos={egresos}
          anio={anio}
          mes={mes}
          onEditIngreso={(item) => {
            setEditando({ tipo: "pago", item });
            setOpen(true);
          }}
          onEditEgreso={(item) => {
            setEditando({ tipo: "egreso", item });
            setOpen(true);
          }}
        />
      </section>

      <button
        type="button"
        onClick={abrirNuevo}
        aria-label={esIngresos ? "Nuevo ingreso (tecla N)" : "Nuevo egreso (tecla N)"}
        className={cn(
          "fixed bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] right-4 z-30 flex size-16 items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-95",
          esIngresos ? "bg-brand-ingreso" : "bg-brand-egreso",
          focusRing,
        )}
      >
        <Plus className="size-7" aria-hidden />
      </button>

      <Sheet
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setEditando(null);
        }}
      >
        <SheetContent
          side="bottom"
          className="flex max-h-[92vh] flex-col gap-0 overflow-y-auto rounded-t-2xl"
        >
          <SheetHeader className="text-left">
            <SheetTitle>{tituloSheet}</SheetTitle>
            <SheetDescription>{descSheet}</SheetDescription>
          </SheetHeader>

          <div className="py-4">
            {editando?.tipo === "pago" ? (
              <PagoForm
                key={editando.item.id}
                perros={perros}
                editar={{
                  pagoId: editando.item.id,
                  perroNombre: editando.item.perroNombre,
                  servicio: editando.item.servicio,
                  monto: editando.item.monto,
                  tipo: editando.item.tipo,
                  fecha: editando.item.fecha,
                  notas: editando.item.descripcion,
                }}
                onDone={() => setOpen(false)}
              />
            ) : editando?.tipo === "egreso" ? (
              <EgresoForm
                key={editando.item.id}
                categorias={categorias}
                editar={{
                  egresoId: editando.item.id,
                  descripcion: editando.item.descripcion,
                  monto: editando.item.monto,
                  categoria: editando.item.categoria,
                  tipo_costo: editando.item.tipo_costo,
                  fecha: editando.item.fecha,
                  notas: editando.item.notas,
                }}
                onDone={() => setOpen(false)}
              />
            ) : esIngresos ? (
              <PagoForm perros={perros} onDone={() => setOpen(false)} />
            ) : (
              <EgresoForm categorias={categorias} onDone={() => setOpen(false)} />
            )}
          </div>

          <SheetClose asChild>
            <Button variant="outline" className="mb-2 h-11 w-full">
              Listo
            </Button>
          </SheetClose>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function BotonEliminar({ tipo, id }: { tipo: "pago" | "egreso"; id: string }) {
  const router = useRouter();
  return (
    <ConfirmButton
      title={tipo === "pago" ? "¿Eliminar este ingreso?" : "¿Eliminar este egreso?"}
      description="Esta acción no se puede deshacer."
      trigger={
        <button
          type="button"
          aria-label="Eliminar"
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-md text-neutral-muted transition-colors active:bg-neutral-sand",
            focusRing,
          )}
        >
          <Trash2 className="size-5" aria-hidden />
        </button>
      }
      onConfirm={async () => {
        const res = tipo === "pago" ? await eliminarPago(id) : await eliminarEgreso(id);
        if (res.ok) {
          toast.success(tipo === "pago" ? "Ingreso eliminado" : "Egreso eliminado");
          router.refresh();
        } else {
          toast.error(res.error);
          throw new Error(res.error);
        }
      }}
    />
  );
}

function ListaPorSemana({
  tab,
  ingresos,
  egresos,
  anio,
  mes,
  onEditIngreso,
  onEditEgreso,
}: {
  tab: Tab;
  ingresos: IngresoItem[];
  egresos: EgresoItem[];
  anio: number;
  mes: number;
  onEditIngreso: (item: IngresoItem) => void;
  onEditEgreso: (item: EgresoItem) => void;
}) {
  const esIngresos = tab === "ingresos";

  if (esIngresos && ingresos.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="Sin ingresos este mes"
        description="Toca + (o la tecla N) para registrar un pago."
      />
    );
  }
  if (!esIngresos && egresos.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Sin egresos este mes"
        description="Toca + (o la tecla N) para registrar un gasto."
      />
    );
  }

  const rangos = rangosSemana(anio, mes);
  const grupos = esIngresos ? agruparPorSemana(ingresos) : agruparPorSemana(egresos);

  return (
    <div className="space-y-2">
      {grupos.map((g) => {
        const est = estiloSemana(g.semana);
        const total = g.items.reduce((s, it) => s + it.monto, 0);
        return (
          <details
            key={g.semana}
            open
            className={cn(
              "group overflow-hidden rounded-xl border border-neutral-border border-l-4",
              est.borde,
            )}
          >
            <summary
              className={cn(
                "flex cursor-pointer list-none items-center justify-between gap-2 p-3 [&::-webkit-details-marker]:hidden",
                est.fondo,
              )}
            >
              <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-neutral-ink">
                <ChevronDown
                  className="size-4 shrink-0 text-neutral-muted transition-transform group-open:rotate-180"
                  aria-hidden
                />
                Semana {g.semana}
                <span className="truncate font-normal text-neutral-muted">
                  {rangos.get(g.semana) ?? ""} · {g.items.length}
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-neutral-ink">
                {formatMoneda(total)}
              </span>
            </summary>
            <ul className="space-y-2 bg-white p-3">
              {esIngresos
                ? (g.items as IngresoItem[]).map((p) => (
                    <FilaIngreso key={p.id} item={p} onEdit={onEditIngreso} />
                  ))
                : (g.items as EgresoItem[]).map((e) => (
                    <FilaEgreso key={e.id} item={e} onEdit={onEditEgreso} />
                  ))}
            </ul>
          </details>
        );
      })}
    </div>
  );
}

function FilaIngreso({ item, onEdit }: { item: IngresoItem; onEdit: (item: IngresoItem) => void }) {
  return (
    <li className="flex items-center gap-2 rounded-lg border border-neutral-border bg-white p-3">
      <button
        type="button"
        onClick={() => onEdit(item)}
        className={cn("flex min-w-0 flex-1 items-center gap-2 rounded-md text-left", focusRing)}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-neutral-ink">{item.perroNombre ?? "Sin perro"}</p>
          <p className="text-xs text-neutral-muted">
            {item.servicio ? `${SERVICIO_LABEL[item.servicio]} · ` : ""}
            {PAGO_TIPO_LABEL[item.tipo]} · {formatFecha(item.fecha)}
          </p>
        </div>
        <p className="shrink-0 font-semibold text-brand-ingreso">{formatMoneda(item.monto)}</p>
      </button>
      <BotonEliminar tipo="pago" id={item.id} />
    </li>
  );
}

function FilaEgreso({ item, onEdit }: { item: EgresoItem; onEdit: (item: EgresoItem) => void }) {
  return (
    <li className="flex items-center gap-2 rounded-lg border border-neutral-border bg-white p-3">
      <button
        type="button"
        onClick={() => onEdit(item)}
        className={cn("flex min-w-0 flex-1 items-center gap-2 rounded-md text-left", focusRing)}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-neutral-ink">{item.descripcion}</p>
          <p className="truncate text-xs text-neutral-muted">
            {item.categoria} · {TIPO_COSTO_LABEL[item.tipo_costo]} · {formatFecha(item.fecha)}
          </p>
        </div>
        <p className="shrink-0 font-semibold text-brand-egreso">{formatMoneda(item.monto)}</p>
      </button>
      <BotonEliminar tipo="egreso" id={item.id} />
    </li>
  );
}
