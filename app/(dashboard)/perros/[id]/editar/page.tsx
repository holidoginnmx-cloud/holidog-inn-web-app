import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sexToSexo } from "@/lib/perro";
import { fechaDeTimestamp } from "@/lib/reservacion";
import {
  PerroForm,
  type PerroFormValues,
  type DewormingFormRow,
  type VaccineFormRow,
} from "@/components/domain/PerroForm";
import { obtenerCatalogoVacunas } from "../../data";

export const dynamic = "force-dynamic";

export default async function EditarPerroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseServerClient();

  const [
    { data: perro, error },
    { data: dewormings, error: dwError },
    { data: vaccines },
    catalogoVacunas,
  ] = await Promise.all([
    supabase
      .from("pets")
      .select(
        "ownerId, nombre:name, raza:breed, sexo:sex, talla:size, fecha_nacimiento:birthDate, peso_kg:weight, veterinario:vetName, esterilizado:isNeutered, alergias:healthIssues, comportamiento:behavior, notas:notes, foto_url:photoUrl, cartilla_foto_url:cartillaUrl, cartillaStatus, cliente:users!pets_ownerId_fkey(nombre:firstName, telefono:phone, email, domicilio:address, domicilioLat:addressLat, domicilioLng:addressLng, domicilioPlaceId:addressPlaceId)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("dewormings")
      .select("id, type, productName, appliedAt, expiresAt, vetName, notes")
      .eq("petId", id)
      .order("appliedAt", { ascending: false }),
    supabase
      .from("vaccines")
      .select("id, catalogId, appliedAt, expiresAt, vetName")
      .eq("petId", id)
      .order("appliedAt", { ascending: false }),
    obtenerCatalogoVacunas(),
  ]);

  if (error) console.error("[perros] Error al cargar perro para editar:", error);
  if (dwError) console.error("[perros] Error al cargar desparasitaciones:", dwError);
  if (!perro) notFound();

  const cli = perro.cliente as {
    nombre: string;
    telefono: string | null;
    email: string | null;
    domicilio: string | null;
    domicilioLat: number | null;
    domicilioLng: number | null;
    domicilioPlaceId: string | null;
  } | null;

  const dewormingsInicial: DewormingFormRow[] = (dewormings ?? []).map((d) => ({
    id: d.id,
    type: d.type,
    productName: d.productName ?? "",
    appliedAt: fechaDeTimestamp(d.appliedAt) ?? "",
    expiresAt: fechaDeTimestamp(d.expiresAt) ?? "",
    vetName: d.vetName ?? "",
    notes: d.notes ?? "",
  }));

  const vaccinesInicial: VaccineFormRow[] = (vaccines ?? []).map((v) => ({
    id: v.id,
    catalogId: v.catalogId ?? "",
    appliedAt: fechaDeTimestamp(v.appliedAt) ?? "",
    expiresAt: fechaDeTimestamp(v.expiresAt) ?? "",
    vetName: v.vetName ?? "",
  }));

  // Campos SIN equivalente en el esquema nuevo (se inicializan vacíos en el
  // form): cliente.notas, perro.domicilio.
  const initial: PerroFormValues = {
    cliente: {
      nombre: cli?.nombre ?? "",
      telefono: cli?.telefono ?? "",
      email: cli?.email ?? "",
      notas: "",
    },
    perro: {
      nombre: perro.nombre,
      raza: perro.raza ?? "",
      sexo: sexToSexo(perro.sexo) ?? "",
      talla: (perro.talla as PerroFormValues["perro"]["talla"] | null) ?? "",
      // birthDate es un timestamp en la BD ("2020-05-15T00:00:00+00:00"); el
      // <input type="date"> solo acepta "YYYY-MM-DD". Sin recortar, el input se
      // renderiza vacío y al guardar borraría la fecha. (Bug reportado por Javi.)
      fecha_nacimiento: perro.fecha_nacimiento ? perro.fecha_nacimiento.slice(0, 10) : "",
      peso_kg: perro.peso_kg != null ? String(perro.peso_kg) : "",
      alergias: perro.alergias ?? "",
      comportamiento: perro.comportamiento ?? "",
      veterinario: perro.veterinario ?? "",
      esterilizado: perro.esterilizado == null ? "" : perro.esterilizado ? "SI" : "NO",
      notas: perro.notas ?? "",
      domicilio: cli?.domicilio ?? "",
      domicilioLat: cli?.domicilioLat != null ? String(cli.domicilioLat) : "",
      domicilioLng: cli?.domicilioLng != null ? String(cli.domicilioLng) : "",
      domicilioPlaceId: cli?.domicilioPlaceId ?? "",
      cartilla_vigente: perro.cartillaStatus === "APPROVED",
    },
    dewormings: dewormingsInicial,
    vaccines: vaccinesInicial,
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href={`/perros/${id}`}
          aria-label="Volver"
          className="flex size-8 items-center justify-center rounded-md text-neutral-muted hover:bg-neutral-sand"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-ink">Editar perro</h1>
      </div>

      <PerroForm
        mode="editar"
        perroId={id}
        clienteId={perro.ownerId}
        initial={initial}
        fotoActualUrl={perro.foto_url}
        cartillaActualUrl={perro.cartilla_foto_url}
        catalogoVacunas={catalogoVacunas}
      />
    </div>
  );
}
