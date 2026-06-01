"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Search, Trash2, Link2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn, formatMoneda, focusRing } from "@/lib/utils";
import { formatFecha } from "@/lib/date";
import { ConfirmButton } from "./ConfirmButton";
import { reasignarPlaceholder, eliminarPlaceholder } from "@/app/(dashboard)/perros/revisar/actions";

export type PlaceholderItem = {
  id: string;
  nombre: string;
  nReservaciones: number;
  total: number;
  servicios: string[];
  desde: string | null;
  hasta: string | null;
  sugerencias: PerroOpcion[];
};

export type PerroOpcion = {
  id: string;
  nombre: string;
  clienteNombre: string | null;
};

export function RevisionPanel({
  placeholders,
  opciones,
}: {
  placeholders: PlaceholderItem[];
  opciones: PerroOpcion[];
}) {
  if (placeholders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="size-10 text-emerald-600" aria-hidden />
        <p className="font-semibold text-neutral-ink">¡Todo revisado!</p>
        <p className="text-sm text-neutral-muted">No quedan perros por revisar.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {placeholders.map((ph) => (
        <li key={ph.id}>
          <PlaceholderCard ph={ph} opciones={opciones} />
        </li>
      ))}
    </ul>
  );
}

function PlaceholderCard({ ph, opciones }: { ph: PlaceholderItem; opciones: PerroOpcion[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [seleccion, setSeleccion] = useState<PerroOpcion | null>(null);
  const [pending, setPending] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return opciones
      .filter(
        (o) =>
          o.nombre.toLowerCase().includes(q) ||
          (o.clienteNombre?.toLowerCase().includes(q) ?? false),
      )
      .slice(0, 20);
  }, [opciones, query]);

  async function reasignar() {
    if (!seleccion) return;
    setPending(true);
    const res = await reasignarPlaceholder(ph.id, seleccion.id);
    if (res.ok) {
      toast.success(`Pagos movidos a ${seleccion.nombre}`);
      router.refresh();
    } else {
      toast.error(res.error);
      setPending(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-neutral-border bg-white p-4">
      {/* Cabecera: nombre sucio + resumen de lo que sostiene */}
      <div>
        <p className="font-medium text-neutral-ink">{ph.nombre}</p>
        <p className="text-sm text-neutral-muted">
          {ph.nReservaciones} {ph.nReservaciones === 1 ? "reservación" : "reservaciones"} ·{" "}
          <span className="font-medium text-brand-teal">{formatMoneda(ph.total)}</span>
          {ph.servicios.length > 0 && <> · {ph.servicios.join(", ")}</>}
        </p>
        {ph.desde && (
          <p className="text-xs text-neutral-muted">
            {formatFecha(ph.desde)}
            {ph.hasta && ph.hasta !== ph.desde ? ` – ${formatFecha(ph.hasta)}` : ""}
          </p>
        )}
      </div>

      {/* Buscador del perro real */}
      {seleccion ? (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-brand-teal/5 px-3 py-2 text-sm">
          <span className="min-w-0 truncate text-neutral-ink">
            Asignar a <span className="font-medium">{seleccion.nombre}</span>
            {seleccion.clienteNombre ? ` · ${seleccion.clienteNombre}` : ""}
          </span>
          <button
            type="button"
            className="shrink-0 text-xs font-medium text-brand-teal"
            onClick={() => {
              setSeleccion(null);
              setQuery("");
            }}
          >
            Cambiar
          </button>
        </div>
      ) : (
        <>
          {/* Sugerencias automáticas: toca una y luego Reasignar */}
          {ph.sugerencias.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-neutral-muted">
                <Sparkles className="size-3.5 text-brand-mustard" aria-hidden />
                Sugerencias:
              </span>
              {ph.sugerencias.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSeleccion(s)}
                  className={cn(
                    "rounded-full border border-brand-teal/30 bg-brand-teal/5 px-3 py-1 text-xs text-brand-teal active:scale-95",
                    focusRing,
                  )}
                >
                  {s.nombre}
                  {s.clienteNombre ? <span className="text-neutral-muted"> · {s.clienteNombre}</span> : null}
                </button>
              ))}
            </div>
          )}
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-muted"
              aria-hidden
            />
            <Input
              type="search"
              placeholder="…o búscalo a mano"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-white pl-9"
              aria-label="Buscar perro real"
            />
            {matches.length > 0 && (
              <ul className="mt-1 max-h-56 overflow-y-auto rounded-lg border border-neutral-border bg-white shadow-sm">
                {matches.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-neutral-sand/60",
                      )}
                      onClick={() => setSeleccion(o)}
                    >
                      <span className="font-medium text-neutral-ink">{o.nombre}</span>
                      {o.clienteNombre && (
                        <span className="text-xs text-neutral-muted">{o.clienteNombre}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {query.trim() && matches.length === 0 && (
              <p className="mt-1 px-1 text-xs text-neutral-muted">Ningún perro coincide.</p>
            )}
          </div>
        </>
      )}

      {/* Acciones */}
      <div className="flex gap-2">
        <Button className="flex-1" onClick={reasignar} disabled={!seleccion || pending}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Link2 className="size-4" aria-hidden />
          )}
          Reasignar
        </Button>
        <ConfirmButton
          title={`¿Eliminar "${ph.nombre}"?`}
          description={`Se borrarán sus ${ph.nReservaciones} reservaciones y ${formatMoneda(
            ph.total,
          )} en pagos. Esto sí borra ese historial. Úsalo solo si es basura.`}
          confirmLabel="Eliminar"
          trigger={
            <Button variant="outline" className="text-destructive" disabled={pending}>
              <Trash2 className="size-4" aria-hidden />
            </Button>
          }
          onConfirm={async () => {
            const res = await eliminarPlaceholder(ph.id);
            if (res.ok) {
              toast.success("Registro eliminado");
              router.refresh();
            } else {
              toast.error(res.error);
              throw new Error(res.error);
            }
          }}
        />
      </div>
    </div>
  );
}
