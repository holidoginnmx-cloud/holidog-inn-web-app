import Image from "next/image";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

// Header fijo arriba. Respeta el safe-area superior de iOS (notch) con
// padding-top env(safe-area-inset-top). La fila interna mide h-16 (64px), valor
// que el layout usa para empujar el contenido principal hacia abajo.
export function AppHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-neutral-border bg-white pt-[env(safe-area-inset-top)]">
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/" aria-label="Inicio — Holidog Inn" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Holidog Inn"
            width={1118}
            height={610}
            priority
            className="h-12 w-auto"
          />
        </Link>
        <UserButton />
      </div>
    </header>
  );
}
