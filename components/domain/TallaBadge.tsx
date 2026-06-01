import { cn } from "@/lib/utils";
import { TALLA_CLASS, TALLA_LABEL, type Talla } from "@/lib/perro";

// Badge de talla con color por tamaño. No renderiza nada si no hay talla
// (perro sin peso registrado).
export function TallaBadge({ talla, className }: { talla: Talla | null; className?: string }) {
  if (!talla) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        TALLA_CLASS[talla],
        className,
      )}
    >
      {TALLA_LABEL[talla]}
    </span>
  );
}
