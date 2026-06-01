import Image from "next/image";
import { inicial, type Talla } from "@/lib/perro";
import { TallaBadge } from "./TallaBadge";

export type PerroListItem = {
  id: string;
  nombre: string;
  talla: Talla | null;
  foto_url: string | null;
  cliente: { nombre: string } | null;
};

// Tarjeta de perro para la cuadrícula de 2 columnas: fila compacta con foto
// circular (o inicial) a la izquierda, nombre + cliente y badge de talla. Es
// solo presentacional; el comportamiento (abrir pop-up) lo aporta PerroDialog.
export function PerroCard({ perro }: { perro: PerroListItem }) {
  return (
    <div className="flex h-full items-center gap-2.5 rounded-xl border border-neutral-border bg-white p-2.5 transition-colors group-active:bg-neutral-sand/60">
      <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-neutral-sand">
        {perro.foto_url ? (
          <Image
            src={perro.foto_url}
            alt={perro.nombre}
            fill
            sizes="40px"
            className="object-cover"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-base font-semibold text-brand-teal">
            {inicial(perro.nombre)}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-ink">{perro.nombre}</p>
        <p className="truncate text-xs text-neutral-muted">
          {perro.cliente?.nombre ?? "Sin cliente"}
        </p>
      </div>

      <TallaBadge talla={perro.talla} className="shrink-0" />
    </div>
  );
}
