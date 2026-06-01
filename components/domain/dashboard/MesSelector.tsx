import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { etiquetaMesAnio, mesAnterior, mesSiguiente, type MesAnio } from "@/lib/date";
import { cn, focusRing } from "@/lib/utils";

const href = (base: string, { anio, mes }: MesAnio) =>
  `${base}?anio=${anio}&mes=${mes}`;

export function MesSelector({ actual, basePath = "/" }: { actual: MesAnio; basePath?: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-neutral-border bg-white p-2">
      <Link
        href={href(basePath, mesAnterior(actual))}
        aria-label="Mes anterior"
        className={cn(
          "flex size-10 items-center justify-center rounded-md text-neutral-muted hover:bg-neutral-sand",
          focusRing,
        )}
      >
        <ChevronLeft className="size-5" aria-hidden />
      </Link>
      <span className="text-base font-semibold capitalize text-neutral-ink">
        {etiquetaMesAnio(actual.anio, actual.mes)}
      </span>
      <Link
        href={href(basePath, mesSiguiente(actual))}
        aria-label="Mes siguiente"
        className={cn(
          "flex size-10 items-center justify-center rounded-md text-neutral-muted hover:bg-neutral-sand",
          focusRing,
        )}
      >
        <ChevronRight className="size-5" aria-hidden />
      </Link>
    </div>
  );
}
