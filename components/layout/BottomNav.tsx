"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dog, Calendar, Wallet, Settings, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/perros", label: "Perros", icon: Dog },
  { href: "/reservaciones", label: "Reservas", icon: Calendar },
  { href: "/movimientos", label: "$ Mov.", icon: Wallet },
  { href: "/config", label: "Config", icon: Settings },
];

function isActive(pathname: string, href: string) {
  // "/" solo activa en la home exacta; el resto, también en sus subrutas.
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

// Nav fijo abajo. Respeta el safe-area inferior de iOS con
// padding-bottom env(safe-area-inset-bottom). La fila interna mide h-16 (64px).
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-border bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="flex h-16 items-stretch">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-teal",
                  active ? "bg-brand-teal text-white" : "text-neutral-muted hover:text-neutral-ink",
                )}
              >
                <Icon className="size-5" aria-hidden />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
