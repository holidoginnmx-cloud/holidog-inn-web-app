"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Sub-sección colapsable para detalles secundarios dentro de una tarjeta
// (p. ej. "Egresos por categoría" o "Ingresos por servicio" dentro de su
// reporte). El contenido se MONTA solo al abrir: así las gráficas de Recharts
// miden su contenedor con un ancho real (un <details> cerrado mide 0).
export function SeccionColapsable({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-4 border-t border-neutral-border pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between text-xs font-medium text-neutral-muted"
      >
        <span>{title}</span>
        <ChevronDown
          className={cn("size-4 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}
