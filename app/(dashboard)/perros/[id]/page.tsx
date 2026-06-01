import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, CalendarPlus, ShieldCheck, ShieldAlert } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { TallaBadge } from "@/components/domain/TallaBadge";
import { SEXO_LABEL, inicial, type Talla, type Sexo } from "@/lib/perro";
import { formatFecha, calcularEdad, estadoCartilla } from "@/lib/date";
import { formatMoneda } from "@/lib/utils";
import { EliminarPerroButton } from "@/components/domain/EliminarPerroButton";

export const dynamic = "force-dynamic";

const SERVICIO_LABEL: Record<string, string> = {
  HOTEL: "Hotel",
  ESTETICA: "Estética",
  GUARDERIA: "Guardería",
};
const ESTADO_LABEL: Record<string, string> = {
  RESERVADA: "Reservada",
  EN_CURSO: "En curso",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

function Dato({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-neutral-muted">{label}</dt>
      <dd className="text-sm font-medium text-neutral-ink">{value || "—"}</dd>
    </div>
  );
}

export default async function PerroFichaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseServerClient();

  const { data: perro, error } = await supabase
    .from("perros")
    .select("*, cliente:clientes(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[perros] Error al cargar ficha:", error);
  }
  if (!perro) notFound();

  const c = perro.cliente as { nombre: string; telefono: string | null } | null;

  const { data: reservaciones } = await supabase
    .from("reservaciones")
    .select("id, servicio, fecha_inicio, fecha_fin, estado, precio_acordado")
    .eq("perro_id", id)
    .order("fecha_inicio", { ascending: false })
    .limit(5);

  const edad = calcularEdad(perro.fecha_nacimiento);
  const cartilla = estadoCartilla(perro.cartilla_vigente, perro.cartilla_vence);

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/perros"
            aria-label="Volver"
            className="flex size-8 items-center justify-center rounded-md text-neutral-muted hover:bg-neutral-sand"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </Link>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/perros/${id}/editar`}>
            <Pencil className="size-4" aria-hidden />
            Editar
          </Link>
        </Button>
      </div>

      {/* Foto + nombre */}
      <div className="flex flex-col items-center text-center">
        <div className="relative size-32 overflow-hidden rounded-full bg-neutral-sand">
          {perro.foto_url ? (
            <Image
              src={perro.foto_url}
              alt={perro.nombre}
              fill
              sizes="128px"
              className="object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-4xl font-semibold text-brand-teal">
              {inicial(perro.nombre)}
            </span>
          )}
        </div>
        <h1 className="mt-3 text-2xl font-semibold text-neutral-ink">{perro.nombre}</h1>
        <p className="text-sm text-neutral-muted">{c?.nombre ?? "Sin cliente"}</p>
        <div className="mt-2">
          <TallaBadge talla={perro.talla as Talla | null} />
        </div>
      </div>

      {/* Datos básicos */}
      <dl className="grid grid-cols-2 gap-4 rounded-xl border border-neutral-border bg-white p-4">
        <Dato label="Raza" value={perro.raza} />
        <Dato label="Sexo" value={perro.sexo ? SEXO_LABEL[perro.sexo as Sexo] : null} />
        <Dato label="Edad" value={edad} />
        <Dato label="Peso" value={perro.peso_kg != null ? `${perro.peso_kg} kg` : null} />
        <Dato label="Veterinario" value={perro.veterinario} />
        <Dato
          label="Esterilizado"
          value={perro.esterilizado == null ? null : perro.esterilizado ? "Sí" : "No"}
        />
        <Dato label="Teléfono del dueño" value={c?.telefono} />
        <Dato label="Nacimiento" value={formatFecha(perro.fecha_nacimiento)} />
      </dl>

      {/* Alergias / comportamiento */}
      {(perro.alergias || perro.comportamiento || perro.notas) && (
        <div className="space-y-3 rounded-xl border border-neutral-border bg-white p-4">
          {perro.alergias && (
            <div>
              <p className="text-xs text-neutral-muted">Alergias</p>
              <p className="text-sm text-neutral-ink">{perro.alergias}</p>
            </div>
          )}
          {perro.comportamiento && (
            <div>
              <p className="text-xs text-neutral-muted">Comportamiento</p>
              <p className="text-sm text-neutral-ink">{perro.comportamiento}</p>
            </div>
          )}
          {perro.notas && (
            <div>
              <p className="text-xs text-neutral-muted">Notas</p>
              <p className="text-sm text-neutral-ink">{perro.notas}</p>
            </div>
          )}
        </div>
      )}

      {/* Cartilla */}
      <div
        className={`flex items-center gap-3 rounded-xl border p-4 ${
          cartilla === "vigente"
            ? "border-emerald-200 bg-emerald-50"
            : cartilla === "por_vencer"
              ? "border-amber-200 bg-amber-50"
              : "border-rose-200 bg-rose-50"
        }`}
      >
        {cartilla === "vencida" ? (
          <ShieldAlert className="size-5 text-rose-600" aria-hidden />
        ) : (
          <ShieldCheck className="size-5 text-emerald-600" aria-hidden />
        )}
        <div className="text-sm">
          <p className="font-medium text-neutral-ink">
            {cartilla === "vencida"
              ? "Cartilla no vigente"
              : cartilla === "por_vencer"
                ? "Cartilla por vencer"
                : "Cartilla vigente"}
          </p>
          {perro.cartilla_vence && (
            <p className="text-neutral-muted">Vence el {formatFecha(perro.cartilla_vence)}</p>
          )}
        </div>
      </div>

      {/* Nueva reservación */}
      <Button asChild className="w-full">
        <Link href={`/reservaciones/nueva?perro=${id}`}>
          <CalendarPlus className="size-4" aria-hidden />
          Nueva reservación
        </Link>
      </Button>

      {/* Historial */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-brand-teal">Reservaciones recientes</h2>
        {reservaciones && reservaciones.length > 0 ? (
          <ul className="space-y-2">
            {reservaciones.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-neutral-border bg-white p-3"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-ink">
                    {SERVICIO_LABEL[r.servicio] ?? r.servicio}
                  </p>
                  <p className="text-xs text-neutral-muted">
                    {formatFecha(r.fecha_inicio)}
                    {r.fecha_fin ? ` – ${formatFecha(r.fecha_fin)}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-neutral-ink">
                    {formatMoneda(r.precio_acordado)}
                  </p>
                  <p className="text-xs text-neutral-muted">{ESTADO_LABEL[r.estado] ?? r.estado}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-neutral-border p-4 text-center text-sm text-neutral-muted">
            Sin reservaciones todavía.
          </p>
        )}
      </section>

      <div className="pt-2">
        <EliminarPerroButton perroId={id} nombre={perro.nombre} />
      </div>
    </div>
  );
}
