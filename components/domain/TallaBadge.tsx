import { cn } from "@/lib/utils";
import { SIZE_CLASS, type PetSize } from "@/lib/perro";
import { TALLA_LABEL } from "@/lib/labels";

// Badge de talla con color por tamaño. No renderiza nada si no hay talla
// (perro sin talla registrada). `talla` es PetSize (XS|S|M|L|XL).
export function TallaBadge({ talla, className }: { talla: PetSize | null; className?: string }) {
  if (!talla) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        SIZE_CLASS[talla],
        className,
      )}
    >
      {TALLA_LABEL[talla]}
    </span>
  );
}
