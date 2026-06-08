import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sexToSexo } from "@/lib/perro";
import { PerroForm, type PerroFormValues } from "@/components/domain/PerroForm";

export const dynamic = "force-dynamic";

export default async function EditarPerroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseServerClient();

  const { data: perro, error } = await supabase
    .from("pets")
    .select(
      "ownerId, nombre:name, raza:breed, sexo:sex, talla:size, fecha_nacimiento:birthDate, peso_kg:weight, veterinario:vetName, esterilizado:isNeutered, alergias:healthIssues, comportamiento:behavior, notas:notes, foto_url:photoUrl, cartilla_foto_url:cartillaUrl, cartillaStatus, cliente:users!pets_ownerId_fkey(nombre:firstName, telefono:phone, email)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) console.error("[perros] Error al cargar perro para editar:", error);
  if (!perro) notFound();

  const cli = perro.cliente as {
    nombre: string;
    telefono: string | null;
    email: string | null;
  } | null;

  // Campos SIN equivalente en el esquema nuevo (se inicializan vacíos en el
  // form): cliente.notas, perro.domicilio, cartilla_vence, desparasitacion_*.
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
      fecha_nacimiento: perro.fecha_nacimiento ?? "",
      peso_kg: perro.peso_kg != null ? String(perro.peso_kg) : "",
      alergias: perro.alergias ?? "",
      comportamiento: perro.comportamiento ?? "",
      veterinario: perro.veterinario ?? "",
      esterilizado: perro.esterilizado == null ? "" : perro.esterilizado ? "SI" : "NO",
      notas: perro.notas ?? "",
      domicilio: "",
      cartilla_vigente: perro.cartillaStatus === "APPROVED",
      cartilla_vence: "",
      desparasitacion_vigente: false,
      desparasitacion_vence: "",
    },
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
      />
    </div>
  );
}
