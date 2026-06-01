"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { UploadCloud, FileSpreadsheet, Loader2, CheckCircle2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatMoneda } from "@/lib/utils";
import { previewMigracion, aplicarMigracion } from "@/app/(dashboard)/config/migrar/actions";
import type { ResumenMigracion } from "@/lib/migracion";

type Stage = "idle" | "leyendo" | "preview" | "aplicando" | "listo";

export function MigracionWizard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [resumen, setResumen] = useState<ResumenMigracion | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function onFile(f: File) {
    if (!f.name.toLowerCase().endsWith(".xlsx")) {
      toast.error("El archivo debe ser .xlsx");
      return;
    }
    setFile(f);
    setStage("leyendo");
    const fd = new FormData();
    fd.set("file", f);
    const res = await previewMigracion(fd);
    if (res.ok) {
      setResumen(res.data);
      setStage("preview");
    } else {
      toast.error(res.error);
      reset();
    }
  }

  async function confirmar() {
    if (!file) return;
    setStage("aplicando");
    const fd = new FormData();
    fd.set("file", file);
    const res = await aplicarMigracion(fd);
    if (res.ok) {
      setResumen(res.data);
      setStage("listo");
      toast.success("Migración aplicada");
      router.refresh();
    } else {
      toast.error(res.error);
      setStage("preview");
    }
  }

  function reset() {
    setFile(null);
    setResumen(null);
    setStage("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  // ---- Dropzone (idle) ----
  if (stage === "idle" || stage === "leyendo") {
    return (
      <div className="space-y-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) onFile(f);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors",
            dragOver
              ? "border-brand-teal bg-brand-teal/5"
              : "border-neutral-border bg-white hover:bg-neutral-sand/40",
          )}
        >
          {stage === "leyendo" ? (
            <>
              <Loader2 className="size-8 animate-spin text-brand-teal" aria-hidden />
              <p className="text-sm text-neutral-muted">Leyendo {file?.name}…</p>
            </>
          ) : (
            <>
              <UploadCloud className="size-8 text-brand-teal" aria-hidden />
              <div>
                <p className="font-medium text-neutral-ink">Arrastra el Excel aquí</p>
                <p className="text-sm text-neutral-muted">o toca para elegir el archivo .xlsx</p>
              </div>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
        </div>
        <p className="flex items-start gap-2 text-xs text-neutral-muted">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
          Re-importar reemplaza por completo los datos marcados como legacy (origen_legacy). Los
          registros que hayas creado a mano en la app se conservan.
        </p>
      </div>
    );
  }

  // ---- Preview / aplicando ----
  if ((stage === "preview" || stage === "aplicando") && resumen) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg border border-neutral-border bg-white p-3 text-sm">
          <FileSpreadsheet className="size-5 text-brand-teal" aria-hidden />
          <span className="truncate text-neutral-ink">{file?.name}</span>
        </div>

        <div className="space-y-3 rounded-xl border border-neutral-border bg-white p-4">
          <p className="text-sm text-neutral-muted">Detecté en el archivo:</p>
          <dl className="grid grid-cols-2 gap-3">
            <Stat label="Clientes" value={resumen.clientes} />
            <Stat label="Perros" value={resumen.perros} />
            <Stat label="Perros del padrón" value={resumen.perrosReales} />
            <Stat label="Perros por revisar" value={resumen.perrosPlaceholder} />
            <Stat label="Reservaciones" value={resumen.reservaciones} />
            <Stat label="Pagos" value={resumen.pagos} />
            <Stat label="Egresos" value={resumen.egresos} />
          </dl>
          <p className="flex items-start gap-2 border-t border-neutral-border pt-3 text-xs text-neutral-muted">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
            {resumen.reservacionesEnlazadas} reservaciones quedan enlazadas a un perro del padrón;{" "}
            {resumen.reservacionesSinEnlace} no se pudieron enlazar (nombre repetido o sin ficha) y
            quedan en perros marcados “REVISAR”. Ningún pago se pierde.
          </p>
          <div className="grid grid-cols-2 gap-3 border-t border-neutral-border pt-3">
            <div>
              <dt className="text-xs text-neutral-muted">Ingresos totales</dt>
              <dd className="text-lg font-bold text-brand-teal">
                {formatMoneda(resumen.totalIngresos)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-muted">Egresos totales</dt>
              <dd className="text-lg font-bold text-brand-mustard">
                {formatMoneda(resumen.totalEgresos)}
              </dd>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={reset}
            disabled={stage === "aplicando"}
          >
            Cancelar
          </Button>
          <Button className="flex-1" onClick={confirmar} disabled={stage === "aplicando"}>
            {stage === "aplicando" && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Confirmar e importar
          </Button>
        </div>
      </div>
    );
  }

  // ---- Listo ----
  if (stage === "listo" && resumen) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <CheckCircle2 className="size-10 text-emerald-600" aria-hidden />
          <p className="font-semibold text-neutral-ink">Migración aplicada</p>
          <p className="text-sm text-neutral-muted">
            {resumen.clientes} clientes · {resumen.perros} perros ({resumen.perrosPlaceholder} por
            revisar) · {resumen.reservaciones} reservaciones · {resumen.pagos} pagos ·{" "}
            {resumen.egresos} egresos
          </p>
        </div>
        <Button variant="outline" className="w-full" onClick={reset}>
          Importar otro archivo
        </Button>
      </div>
    );
  }

  return null;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs text-neutral-muted">{label}</dt>
      <dd className="text-lg font-bold text-neutral-ink">{value}</dd>
    </div>
  );
}
