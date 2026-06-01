"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] Error no controlado:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-rose-100">
        <TriangleAlert className="size-8 text-rose-600" aria-hidden />
      </div>
      <div>
        <p className="text-lg font-semibold text-neutral-ink">Algo salió mal</p>
        <p className="mt-1 text-sm text-neutral-muted">
          No pudimos cargar esta sección. Puede ser un problema de conexión.
        </p>
      </div>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  );
}
