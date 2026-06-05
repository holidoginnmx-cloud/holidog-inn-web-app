import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PerroForm, type PerroFormValues } from "@/components/domain/PerroForm";

export const dynamic = "force-dynamic";

export default async function EditarPerroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseServerClient();

  const { data: perro, error } = await supabase
    .from("perros")
    .select("*, cliente:clientes(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) console.error("[perros] Error al cargar perro para editar:", error);
  if (!perro) notFound();

  const cli = perro.cliente as {
    nombre: string;
    telefono: string | null;
    email: string | null;
    notas: string | null;
  } | null;

  const initial: PerroFormValues = {
    cliente: {
      nombre: cli?.nombre ?? "",
      telefono: cli?.telefono ?? "",
      email: cli?.email ?? "",
      notas: cli?.notas ?? "",
    },
    perro: {
      nombre: perro.nombre,
      raza: perro.raza ?? "",
      sexo: (perro.sexo as "MACHO" | "HEMBRA" | null) ?? "",
      talla: (perro.talla as PerroFormValues["perro"]["talla"] | null) ?? "",
      fecha_nacimiento: perro.fecha_nacimiento ?? "",
      peso_kg: perro.peso_kg != null ? String(perro.peso_kg) : "",
      alergias: perro.alergias ?? "",
      comportamiento: perro.comportamiento ?? "",
      veterinario: perro.veterinario ?? "",
      esterilizado: perro.esterilizado == null ? "" : perro.esterilizado ? "SI" : "NO",
      notas: perro.notas ?? "",
      domicilio: perro.domicilio ?? "",
      cartilla_vigente: perro.cartilla_vigente,
      cartilla_vence: perro.cartilla_vence ?? "",
      desparasitacion_vigente: perro.desparasitacion_vigente,
      desparasitacion_vence: perro.desparasitacion_vence ?? "",
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
        clienteId={perro.cliente_id}
        initial={initial}
        fotoActualUrl={perro.foto_url}
        cartillaActualUrl={perro.cartilla_foto_url}
      />
    </div>
  );
}
