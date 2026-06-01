import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Toaster } from "@/components/ui/sonner";

// Layout del área autenticada (mobile-first; el desktop hereda lo mismo, sin
// sidebar). Header y BottomNav son `fixed`, así que el <main> reserva espacio
// arriba (h-16 header + safe-area-top) y abajo (h-16 nav + safe-area-bottom)
// para no quedar tapado en iOS.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <main className="flex flex-1 flex-col px-4 pb-[calc(env(safe-area-inset-bottom)+4rem)] pt-[calc(env(safe-area-inset-top)+4rem)]">
        <div className="py-6">{children}</div>
      </main>
      <BottomNav />
      <Toaster />
    </>
  );
}
