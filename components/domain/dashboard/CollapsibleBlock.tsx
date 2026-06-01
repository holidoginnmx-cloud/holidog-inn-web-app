import { ChevronDown } from "lucide-react";

// Bloque colapsable con <details> nativo (sin JS). Abierto por defecto para que
// las gráficas de Recharts midan bien su contenedor al renderizar.
export function CollapsibleBlock({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group rounded-xl border border-neutral-border bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-semibold text-neutral-ink [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown
          className="size-4 text-neutral-muted transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  );
}
