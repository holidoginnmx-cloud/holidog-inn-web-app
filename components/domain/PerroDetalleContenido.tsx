"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Pencil, CalendarPlus, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TallaBadge } from "./TallaBadge";
import { EliminarPerroButton } from "./EliminarPerroButton";
import { SEXO_LABEL, inicial, type PetSize, type Sexo } from "@/lib/perro";
import { SERVICIO_LABEL, ESTADO_LABEL } from "@/lib/labels";
import { DEWORMING_TYPE_LABEL } from "@/lib/validations/salud";
import { formatFecha, calcularEdad, hoyISO } from "@/lib/date";
import { formatMoneda } from "@/lib/utils";
import { obtenerDetallePerro, type PerroDetalle } from "@/app/(dashboard)/perros/actions";

function Dato({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-neutral-muted">{label}</dt>
      <dd className="text-sm font-medium text-neutral-ink">{value || "—"}</dd>
    </div>
  );
}

function BotonCerrar() {
  return (
    <Dialog.Close
      aria-label="Cerrar"
      className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-md text-neutral-muted hover:bg-neutral-sand"
    >
      <X className="size-5" aria-hidden />
    </Dialog.Close>
  );
}

// Contenido del pop-up de un perro. Carga la ficha completa bajo demanda y la
// muestra con el mismo layout de la pantalla de detalle, adaptado al modal.
export function PerroDetalleContenido({
  perroId,
  onClose,
}: {
  perroId: string;
  onClose: () => void;
}) {
  const [detalle, setDetalle] = useState<PerroDetalle | null>(null);
  const [error, setError] = useState(false);

  // Excepción consciente a "no useEffect para fetch" (CLAUDE.md §6): este es un
  // pop-up de cliente que carga la ficha SOLO al abrirse, sobre datos que ya
  // vienen del servidor en la lista. No justifica añadir SWR/React Query (que
  // CLAUDE.md desaconseja); el flag `activo` evita el set tras desmontar.
  useEffect(() => {
    let activo = true;
    obtenerDetallePerro(perroId).then((res) => {
      if (!activo) return;
      if (res.ok) setDetalle(res.data);
      else setError(true);
    });
    return () => {
      activo = false;
    };
  }, [perroId]);

  if (error) {
    return (
      <div className="py-8 text-center">
        <Dialog.Title className="text-base font-semibold text-neutral-ink">
          No se pudo cargar
        </Dialog.Title>
        <Dialog.Description className="mt-1 text-sm text-neutral-muted">
          Intenta de nuevo en un momento.
        </Dialog.Description>
        <BotonCerrar />
      </div>
    );
  }

  if (!detalle) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <Dialog.Title className="sr-only">Cargando perro</Dialog.Title>
        <Loader2 className="size-6 animate-spin text-brand-teal" aria-hidden />
        <p className="text-sm text-neutral-muted">Cargando…</p>
      </div>
    );
  }

  const { perro, cliente, reservaciones, dewormings, vaccines } = detalle;
  const edad = calcularEdad(perro.fecha_nacimiento);
  // La cartilla está vigente si fue aprobada Y ninguna vacuna registrada venció
  // (misma regla que la app móvil, que demota a EXPIRED al vencer una vacuna).
  const algunaVacunaVencida = vaccines.some((v) => v.expiresAt && v.expiresAt < hoyISO());
  const cartilla = perro.cartilla_vigente && !algunaVacunaVencida ? "vigente" : "vencida";

  return (
    <div className="space-y-5">
      <BotonCerrar />

      {/* Foto + nombre */}
      <div className="flex flex-col items-center text-center">
        <div className="relative size-24 overflow-hidden rounded-full bg-neutral-sand">
          {perro.foto_url ? (
            <Image
              src={perro.foto_url}
              alt={perro.nombre}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-3xl font-semibold text-brand-teal">
              {inicial(perro.nombre)}
            </span>
          )}
        </div>
        <Dialog.Title className="mt-3 text-xl font-semibold text-neutral-ink">
          {perro.nombre}
        </Dialog.Title>
        <Dialog.Description className="text-sm text-neutral-muted">
          {cliente?.nombre ?? "Sin cliente"}
        </Dialog.Description>
        <div className="mt-2">
          <TallaBadge talla={perro.talla as PetSize | null} />
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
        <Dato label="Teléfono del dueño" value={cliente?.telefono} />
        <Dato label="Nacimiento" value={formatFecha(perro.fecha_nacimiento)} />
      </dl>

      {/* Alergias / comportamiento / notas / domicilio */}
      {(perro.alergias || perro.comportamiento || perro.notas || perro.domicilio) && (
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
          {perro.domicilio && (
            <div>
              <p className="text-xs text-neutral-muted">Domicilio</p>
              <p className="text-sm text-neutral-ink">{perro.domicilio}</p>
            </div>
          )}
        </div>
      )}

      {/* Cartilla (estado binario; sin fecha de vencimiento en el esquema nuevo) */}
      <div
        className={`flex items-center gap-3 rounded-xl border p-4 ${
          cartilla === "vigente" ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"
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

      {/* Vacunas (tabla vaccines) */}
      {vaccines.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-brand-teal">Vacunas</h2>
          <ul className="space-y-2">
            {vaccines.map((v) => {
              const vigente = !v.expiresAt || v.expiresAt >= hoyISO();
              return (
                <li
                  key={v.id}
                  className="flex items-center justify-between rounded-xl border border-neutral-border bg-white px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-neutral-ink">{v.nombre}</p>
                    <p className="text-xs text-neutral-muted">
                      {v.expiresAt ? `Vence: ${formatFecha(v.expiresAt)}` : "Sin vencimiento"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      vigente ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {vigente ? "Vigente" : "Vencida"}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Desparasitaciones (tabla dewormings) */}
      {dewormings.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-brand-teal">Desparasitaciones</h2>
          <ul className="space-y-2">
            {dewormings.map((d) => {
              const vigente = !d.expiresAt || d.expiresAt >= hoyISO();
              return (
                <li
                  key={d.id}
                  className="flex items-center justify-between rounded-xl border border-neutral-border bg-white px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-neutral-ink">
                      {DEWORMING_TYPE_LABEL[d.type]}
                      {d.productName ? ` · ${d.productName}` : ""}
                    </p>
                    <p className="text-xs text-neutral-muted">
                      {d.expiresAt
                        ? `Próxima dosis: ${formatFecha(d.expiresAt)}`
                        : "Sin vencimiento"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      vigente ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {vigente ? "Vigente" : "Vencida"}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Acciones */}
      <div className="grid grid-cols-2 gap-2">
        <Button asChild variant="outline" onClick={onClose}>
          <Link href={`/perros/${perro.id}/editar`}>
            <Pencil className="size-4" aria-hidden />
            Editar
          </Link>
        </Button>
        <Button asChild onClick={onClose}>
          <Link href={`/reservaciones/nueva?perro=${perro.id}`}>
            <CalendarPlus className="size-4" aria-hidden />
            Reservación
          </Link>
        </Button>
      </div>

      {/* Historial */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-brand-teal">Reservaciones recientes</h2>
        {reservaciones.length > 0 ? (
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
                  <p className="text-sm font-medium text-brand-ingreso">
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

      <EliminarPerroButton perroId={perro.id} nombre={perro.nombre} />
    </div>
  );
}
