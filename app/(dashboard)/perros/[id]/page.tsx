import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, CalendarPlus, ShieldCheck, ShieldAlert } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { TallaBadge } from "@/components/domain/TallaBadge";
import { PagoBadge } from "@/components/domain/PagoBadge";
import { EsteticaBadges } from "@/components/domain/EsteticaBadges";
import { derivarEstetica, RESV_ADDON_SELECT } from "@/lib/estetica";
import { sumarPagos } from "@/lib/reservacion";
import { SEXO_LABEL, inicial, sexToSexo, type PetSize, type Sexo } from "@/lib/perro";
import { typeToServicio, statusToEstado, type ReservationType, type ReservationStatus } from "@/lib/labels";
import { formatFecha, calcularEdad } from "@/lib/date";
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
    .from("pets")
    .select(
      "id, nombre:name, raza:breed, sexo:sex, talla:size, fecha_nacimiento:birthDate, peso_kg:weight, veterinario:vetName, esterilizado:isNeutered, alergias:healthIssues, comportamiento:behavior, notas:notes, foto_url:photoUrl, cartilla_foto_url:cartillaUrl, cartillaStatus, cliente:users!pets_ownerId_fkey(nombre:firstName, telefono:phone)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[perros] Error al cargar ficha:", error);
  }
  if (!perro) notFound();

  const c = perro.cliente as { nombre: string; telefono: string | null } | null;

  const { data: reservacionesRaw } = await supabase
    .from("reservations")
    .select(
      `id, servicio:reservationType, fecha_inicio:checkIn, fecha_fin:checkOut, estado:status, precio_acordado:totalAmount, pagos:payments(monto:amount), ${RESV_ADDON_SELECT}`,
    )
    .eq("petId", id)
    .order("checkIn", { ascending: false })
    .limit(5);

  // Traducimos servicio/estado de los enums en inglés al español del UI.
  const reservaciones = (reservacionesRaw ?? []).map((r) => ({
    id: r.id,
    servicio: typeToServicio(r.servicio as ReservationType),
    fecha_inicio: r.fecha_inicio,
    fecha_fin: r.fecha_fin,
    estado: statusToEstado(r.estado as ReservationStatus),
    precio_acordado: r.precio_acordado,
    pagos: r.pagos,
    ...derivarEstetica(r.servicio as ReservationType, r.reservation_addons),
  }));

  // cartilla_vigente derivado de cartillaStatus. Ya no hay fecha de vencimiento
  // (sin equivalente), así que el estado es binario. Desparasitación NO tiene
  // equivalente en pets (se omite la sección).
  const edad = calcularEdad(perro.fecha_nacimiento);
  const cartilla = perro.cartillaStatus === "APPROVED" ? "vigente" : "vencida";

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
          <TallaBadge talla={perro.talla as PetSize | null} />
        </div>
      </div>

      {/* Datos básicos. `sexo` viene como "M"/"F"; se traduce a MACHO/HEMBRA.
          "Domicilio" se omite: no tiene columna equivalente en pets. */}
      <dl className="grid grid-cols-2 gap-4 rounded-xl border border-neutral-border bg-white p-4">
        <Dato label="Raza" value={perro.raza} />
        <Dato
          label="Sexo"
          value={sexToSexo(perro.sexo) ? SEXO_LABEL[sexToSexo(perro.sexo) as Sexo] : null}
        />
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

      {/* Cartilla (estado binario; sin fecha de vencimiento en el esquema nuevo) */}
      <div
        className={`flex items-center gap-3 rounded-xl border p-4 ${
          cartilla === "vigente"
            ? "border-emerald-200 bg-emerald-50"
            : "border-rose-200 bg-rose-50"
        }`}
      >
        {cartilla === "vigente" ? (
          <ShieldCheck className="size-5 text-emerald-600" aria-hidden />
        ) : (
          <ShieldAlert className="size-5 text-rose-600" aria-hidden />
        )}
        <div className="text-sm">
          <p className="font-medium text-neutral-ink">
            {cartilla === "vigente" ? "Cartilla vigente" : "Cartilla no vigente"}
          </p>
        </div>
      </div>

      {/* Foto de la cartilla */}
      {perro.cartilla_foto_url && (
        <a
          href={perro.cartilla_foto_url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block aspect-[4/3] w-full overflow-hidden rounded-xl border border-neutral-border bg-white"
        >
          <Image
            src={perro.cartilla_foto_url}
            alt={`Cartilla de ${perro.nombre}`}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-contain"
          />
        </a>
      )}

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
                  <EsteticaBadges
                    incluyeBano={r.incluyeBano}
                    incluyeCorte={r.incluyeCorte}
                    incluyeDeslanado={r.incluyeDeslanado}
                    className="mt-1"
                  />
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  <p className="text-sm font-medium text-brand-ingreso">
                    {formatMoneda(r.precio_acordado)}
                  </p>
                  <PagoBadge precioAcordado={r.precio_acordado} pagado={sumarPagos(r.pagos)} />
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
