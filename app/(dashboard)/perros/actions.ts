"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, type DB, ERROR_GENERICO, validar, withSupabase } from "@/lib/actions";
import { calcularSize, sexoToSex, type PetSize } from "@/lib/perro";
import {
  typeToServicio,
  statusToEstado,
  type ReservationType,
  type ReservationStatus,
} from "@/lib/labels";
import { nuevoPerroSchema, type ClienteInput, type PerroInput } from "@/lib/validations/perro";

const BUCKET = "fotos-perros";

// Reconstruye el objeto { cliente, perro } desde el FormData del formulario.
function leerFormData(formData: FormData) {
  const g = (k: string) => formData.get(k);
  return {
    cliente: {
      nombre: g("cliente.nombre"),
      telefono: g("cliente.telefono"),
      email: g("cliente.email"),
      notas: g("cliente.notas"),
    },
    perro: {
      nombre: g("perro.nombre"),
      raza: g("perro.raza"),
      sexo: g("perro.sexo"),
      talla: g("perro.talla"),
      fecha_nacimiento: g("perro.fecha_nacimiento"),
      peso_kg: g("perro.peso_kg"),
      alergias: g("perro.alergias"),
      comportamiento: g("perro.comportamiento"),
      veterinario: g("perro.veterinario"),
      esterilizado: g("perro.esterilizado"),
      notas: g("perro.notas"),
      domicilio: g("perro.domicilio"),
      cartilla_vigente: g("perro.cartilla_vigente"),
      cartilla_vence: g("perro.cartilla_vence"),
      desparasitacion_vigente: g("perro.desparasitacion_vigente"),
      desparasitacion_vence: g("perro.desparasitacion_vence"),
    },
  };
}

// --------------------------------------------------------------------------
// Mapeo FORM (español) → columnas de las tablas unificadas (inglés).
// --------------------------------------------------------------------------

// users (cliente con role='OWNER'). `id`/`updatedAt` no tienen default en la BD,
// así que los generamos aquí. `notas` del cliente NO tiene columna en users → se
// ignora. `lastName` es un placeholder "—" (el nombre completo va en firstName).
function clienteAUsuario(cliente: ClienteInput) {
  const email = cliente.email?.trim() || `walkin+${crypto.randomUUID()}@holidoginn.local`;
  return {
    id: crypto.randomUUID(),
    firstName: cliente.nombre,
    lastName: "—",
    phone: cliente.telefono ?? null,
    email,
    role: "OWNER" as const,
    updatedAt: new Date().toISOString(),
  };
}

// pets. `size` SIEMPRE se computa del peso (default "M" si null); si no hay peso
// pero el usuario eligió talla a mano, respetamos esa selección. `sexo` → sex
// ("M"/"F"). `cartilla_vigente` → cartillaStatus ("APPROVED" | null). Campos sin
// equivalente (cartilla_vence, desparasitacion_*, domicilio) se IGNORAN.
// `veterinario`→vetName, `esterilizado`→isNeutered (no listados en el brief pero
// existen en pets; se mapean y queda documentado).
function perroAMascota(perro: PerroInput) {
  const tallaManual = (perro.talla ?? null) as PetSize | null;
  const size: PetSize =
    perro.peso_kg != null ? calcularSize(perro.peso_kg) : (tallaManual ?? "M");

  return {
    name: perro.nombre,
    breed: perro.raza ?? null,
    sex: sexoToSex(perro.sexo),
    size,
    birthDate: perro.fecha_nacimiento ?? null,
    weight: perro.peso_kg,
    healthIssues: perro.alergias ?? null,
    behavior: perro.comportamiento ?? null,
    vetName: perro.veterinario ?? null,
    notes: perro.notas ?? null,
    cartillaStatus: (perro.cartilla_vigente ? "APPROVED" : null) as
      | "APPROVED"
      | null,
    // `esterilizado` es tri-estado en el form; isNeutered es bool no-nulo.
    ...(perro.esterilizado != null ? { isNeutered: perro.esterilizado } : {}),
  };
}

// Sube un archivo (ya comprimido en cliente) al bucket público y devuelve su URL.
// `prefix` separa las carpetas dentro del bucket (p. ej. "cartillas/").
async function subirFoto(supabase: DB, file: File, prefix = ""): Promise<string | null> {
  const ext = file.type === "image/webp" ? "webp" : "jpg";
  const path = `${prefix}${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) {
    console.error("[perros] Error al subir foto:", error);
    return null;
  }
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function archivoDeFormData(formData: FormData, campo: string): File | null {
  const f = formData.get(campo);
  return f instanceof File && f.size > 0 ? f : null;
}

// --------------------------------------------------------------------------
// Alta: crea Cliente (users role=OWNER) + Perro (pets) en una sola operación.
// --------------------------------------------------------------------------
export async function crearClienteYPerro(
  formData: FormData,
): Promise<ActionResult<{ perroId: string }>> {
  const v = validar(nuevoPerroSchema, leerFormData(formData));
  if (!v.ok) return v;
  const { cliente, perro } = v.data;

  return withSupabase("perros", async (supabase) => {
    // 1) Fotos (opcionales): la del perro y la de la cartilla.
    const fotoFile = archivoDeFormData(formData, "foto");
    const cartillaFile = archivoDeFormData(formData, "cartilla");
    const photoUrl = fotoFile ? await subirFoto(supabase, fotoFile) : null;
    const cartillaUrl = cartillaFile
      ? await subirFoto(supabase, cartillaFile, "cartillas/")
      : null;

    // 2) Cliente (users, role='OWNER').
    const { data: clienteRow, error: clienteErr } = await supabase
      .from("users")
      .insert(clienteAUsuario(cliente))
      .select("id")
      .single();
    if (clienteErr || !clienteRow) {
      console.error("[perros] Error al crear cliente:", clienteErr);
      return { ok: false, error: ERROR_GENERICO };
    }

    // 3) Perro (pets), ligado al cliente vía ownerId.
    const { data: perroRow, error: perroErr } = await supabase
      .from("pets")
      .insert({
        ...perroAMascota(perro),
        id: crypto.randomUUID(),
        ownerId: clienteRow.id,
        photoUrl,
        cartillaUrl,
        updatedAt: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (perroErr || !perroRow) {
      console.error("[perros] Error al crear perro:", perroErr);
      // Limpieza: evitar un cliente huérfano si el perro no se pudo crear.
      await supabase.from("users").delete().eq("id", clienteRow.id);
      return { ok: false, error: ERROR_GENERICO };
    }

    revalidatePath("/perros");
    return { ok: true, data: { perroId: perroRow.id } };
  });
}

// --------------------------------------------------------------------------
// Edición: actualiza Perro + su Cliente. Si no llega foto nueva, conserva la actual.
// --------------------------------------------------------------------------
export async function actualizarClienteYPerro(
  perroId: string,
  clienteId: string,
  formData: FormData,
): Promise<ActionResult<{ perroId: string }>> {
  const v = validar(nuevoPerroSchema, leerFormData(formData));
  if (!v.ok) return v;
  const { cliente, perro } = v.data;

  return withSupabase("perros", async (supabase) => {
    const fotoFile = archivoDeFormData(formData, "foto");
    const cartillaFile = archivoDeFormData(formData, "cartilla");
    const photoUrl = fotoFile ? await subirFoto(supabase, fotoFile) : null;
    const cartillaUrl = cartillaFile
      ? await subirFoto(supabase, cartillaFile, "cartillas/")
      : null;

    // Cliente (users). `notas` se ignora (no hay columna). `id`/role no se tocan.
    const { error: clienteErr } = await supabase
      .from("users")
      .update({
        firstName: cliente.nombre,
        phone: cliente.telefono ?? null,
        email: cliente.email?.trim() || undefined,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", clienteId);
    if (clienteErr) {
      console.error("[perros] Error al actualizar cliente:", clienteErr);
      return { ok: false, error: ERROR_GENERICO };
    }

    const { error: perroErr } = await supabase
      .from("pets")
      .update({
        ...perroAMascota(perro),
        updatedAt: new Date().toISOString(),
        ...(photoUrl ? { photoUrl } : {}),
        ...(cartillaUrl ? { cartillaUrl } : {}),
      })
      .eq("id", perroId);
    if (perroErr) {
      console.error("[perros] Error al actualizar perro:", perroErr);
      return { ok: false, error: ERROR_GENERICO };
    }

    revalidatePath("/perros");
    revalidatePath(`/perros/${perroId}`);
    return { ok: true, data: { perroId } };
  });
}

// --------------------------------------------------------------------------
// Detalle: carga la ficha completa de un perro + sus reservaciones recientes.
// Lo consume el pop-up de la lista (PerroDialog) para mostrar la info sin
// navegar a una pantalla aparte.
// --------------------------------------------------------------------------
// Ficha del perro con NOMBRES EN ESPAÑOL (lo que espera el JSX). Se arma con
// alias en el select + derivaciones (cartilla_vigente, sexo legacy, talla=size).
export type PerroFicha = {
  id: string;
  nombre: string;
  raza: string | null;
  sexo: "MACHO" | "HEMBRA" | null;
  talla: PetSize | null;
  fecha_nacimiento: string | null;
  peso_kg: number | null;
  veterinario: string | null;
  esterilizado: boolean | null;
  alergias: string | null;
  comportamiento: string | null;
  notas: string | null;
  domicilio: string | null;
  foto_url: string | null;
  cartilla_foto_url: string | null;
  cartilla_vigente: boolean;
  cartilla_vence: string | null;
  desparasitacion_vigente: boolean;
  desparasitacion_vence: string | null;
};

export type PerroReservacion = {
  id: string;
  servicio: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: string;
  precio_acordado: number | null;
};

export type PerroDetalle = {
  perro: PerroFicha;
  cliente: { nombre: string; telefono: string | null } | null;
  reservaciones: PerroReservacion[];
};

export async function obtenerDetallePerro(perroId: string): Promise<ActionResult<PerroDetalle>> {
  return withSupabase("perros", async (supabase) => {
    const { data: perro, error } = await supabase
      .from("pets")
      .select(
        "id, nombre:name, raza:breed, sexo:sex, talla:size, fecha_nacimiento:birthDate, peso_kg:weight, veterinario:vetName, esterilizado:isNeutered, alergias:healthIssues, comportamiento:behavior, notas:notes, foto_url:photoUrl, cartilla_foto_url:cartillaUrl, cartillaStatus, cliente:users!pets_ownerId_fkey(nombre:firstName, telefono:phone)",
      )
      .eq("id", perroId)
      .maybeSingle();
    if (error || !perro) {
      console.error("[perros] Error al cargar ficha:", error);
      return { ok: false, error: "No se pudo cargar el perro." };
    }

    const cliente = perro.cliente as { nombre: string; telefono: string | null } | null;

    // SIN EQUIVALENTE en pets (se omiten en lectura): domicilio, cartilla_vence,
    // desparasitacion_vigente, desparasitacion_vence. cartilla_vigente se deriva
    // de cartillaStatus === "APPROVED".
    const ficha: PerroFicha = {
      id: perro.id,
      nombre: perro.nombre,
      raza: perro.raza,
      sexo: perro.sexo === "M" ? "MACHO" : perro.sexo === "F" ? "HEMBRA" : null,
      talla: perro.talla as PetSize | null,
      fecha_nacimiento: perro.fecha_nacimiento,
      peso_kg: perro.peso_kg,
      veterinario: perro.veterinario,
      esterilizado: perro.esterilizado,
      alergias: perro.alergias,
      comportamiento: perro.comportamiento,
      notas: perro.notas,
      domicilio: null,
      foto_url: perro.foto_url,
      cartilla_foto_url: perro.cartilla_foto_url,
      cartilla_vigente: perro.cartillaStatus === "APPROVED",
      cartilla_vence: null,
      desparasitacion_vigente: false,
      desparasitacion_vence: null,
    };

    const { data: reservaciones } = await supabase
      .from("reservations")
      .select(
        "id, servicio:reservationType, fecha_inicio:checkIn, fecha_fin:checkOut, estado:status, precio_acordado:totalAmount",
      )
      .eq("petId", perroId)
      .order("checkIn", { ascending: false })
      .limit(5);

    // Traducimos servicio/estado de los enums en inglés al español del UI.
    const reservacionesUi: PerroReservacion[] = (reservaciones ?? []).map((r) => ({
      id: r.id,
      servicio: typeToServicio(r.servicio as ReservationType),
      fecha_inicio: r.fecha_inicio ?? "",
      fecha_fin: r.fecha_fin,
      estado: statusToEstado(r.estado as ReservationStatus),
      precio_acordado: r.precio_acordado,
    }));

    return {
      ok: true,
      data: {
        perro: ficha,
        cliente,
        reservaciones: reservacionesUi,
      },
    };
  });
}

// Elimina un perro (cascada borra sus reservaciones y pagos por FK).
export async function eliminarPerro(perroId: string): Promise<ActionResult<null>> {
  return withSupabase("perros", async (supabase) => {
    const { error } = await supabase.from("pets").delete().eq("id", perroId);
    if (error) {
      console.error("[perros] Error al eliminar perro:", error);
      return { ok: false, error: ERROR_GENERICO };
    }
    revalidatePath("/perros");
    return { ok: true, data: null };
  });
}
