import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MigracionWizard } from "@/components/domain/MigracionWizard";

export default function MigrarPage() {
  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      <div className="flex items-center gap-2">
        <Link
          href="/config"
          aria-label="Volver"
          className="flex size-8 items-center justify-center rounded-md text-neutral-muted hover:bg-neutral-sand"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-ink">Migrar datos</h1>
      </div>

      <p className="text-sm text-neutral-muted">
        Sube el Excel original (la hoja <code className="rounded bg-neutral-sand px-1">2026</code>).
        Verás un resumen antes de aplicar; nada se escribe hasta que confirmes.
      </p>

      <MigracionWizard />
    </div>
  );
}
