import Link from "next/link";
import { Wallet, CalendarPlus, CalendarClock, type LucideIcon } from "lucide-react";
import { cn, focusRing } from "@/lib/utils";

type Accion = { href: string; label: string; icon: LucideIcon; bg: string };

const ACCIONES: Accion[] = [
  // "Registrar pago" es un ingreso → verde.
  { href: "/movimientos", label: "Registrar pago", icon: Wallet, bg: "bg-brand-ingreso" },
  { href: "/reservaciones/nueva", label: "Nueva reserva", icon: CalendarPlus, bg: "bg-brand-teal" },
  { href: "/reservaciones", label: "Ver hoy", icon: CalendarClock, bg: "bg-brand-teal" },
];

// Accesos rápidos del dashboard: lo que el dueño hace más seguido, a un toque.
export function AccionesRapidas() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {ACCIONES.map(({ href, label, icon: Icon, bg }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex h-20 flex-col items-center justify-center gap-1.5 rounded-xl px-2 text-center text-white shadow-sm transition-transform active:scale-95",
            bg,
            focusRing,
          )}
        >
          <Icon className="size-6" aria-hidden />
          <span className="text-xs font-medium leading-tight">{label}</span>
        </Link>
      ))}
    </div>
  );
}
