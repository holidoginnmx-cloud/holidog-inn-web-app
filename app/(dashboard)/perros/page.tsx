import Link from "next/link";
import { Plus, ChevronRight } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn, focusRing } from "@/lib/utils";
import { MARCA_REVISAR_PERRO } from "@/lib/perro";
import { PerroList } from "@/components/domain/PerroList";
import type { PerroListItem } from "@/components/domain/PerroCard";

// App de administración: siempre datos frescos.
export const dynamic = "force-dynamic";

export default async function PerrosPage() {
  const perros: PerroListItem[] = [];
  let porRevisar = 0;
  let errorCarga = false;

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("perros")
      .select("id, nombre, talla, foto_url, notas, cliente:clientes(nombre)")
      .order("nombre", { ascending: true });
    if (error) throw error;

    for (const p of data ?? []) {
      // Ocultamos los placeholders "REVISAR" (pagos viejos sin enlazar a un perro real).
      if (p.notas === MARCA_REVISAR_PERRO) {
        porRevisar++;
        continue;
      }
      // El embed puede tiparse como objeto o arreglo según la inferencia; normalizamos.
      const c = p.cliente as { nombre: string } | { nombre: string }[] | null;
      const cliente = Array.isArray(c) ? (c[0] ?? null) : c;
      perros.push({ id: p.id, nombre: p.nombre, talla: p.talla, foto_url: p.foto_url, cliente });
    }
  } catch (e) {
    console.error("[perros] Error al cargar lista:", e);
    errorCarga = true;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-neutral-ink">Perros</h1>

      {porRevisar > 0 && (
        <Link
          href="/perros/revisar"
          className={cn(
            "flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm",
            focusRing,
          )}
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-mustard text-xs font-bold text-white">
            {porRevisar}
          </span>
          <span className="flex-1 text-neutral-ink">
            perros por revisar (pagos viejos sin enlazar)
          </span>
          <ChevronRight className="size-4 shrink-0 text-neutral-muted" aria-hidden />
        </Link>
      )}

      {errorCarga ? (
        <p className="bg-destructive/10 text-destructive rounded-md px-3 py-6 text-center text-sm">
          No se pudo cargar la lista. Revisa la conexión a la base de datos.
        </p>
      ) : (
        <PerroList perros={perros} />
      )}

      {/* Botón flotante "+" — flota por encima del BottomNav. */}
      <Link
        href="/perros/nuevo"
        aria-label="Agregar perro"
        className={cn(
          "fixed bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] right-4 z-30 flex size-14 items-center justify-center rounded-full bg-brand-teal text-white shadow-lg transition-transform active:scale-95",
          focusRing,
        )}
      >
        <Plus className="size-6" aria-hidden />
      </Link>
    </div>
  );
}
