"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, type DB, ERROR_GENERICO, validar, withSupabase } from "@/lib/actions";
import { calcularSize, sexoToSex, type PetSize } from "@/lib/perro";
import {
  typeToServicio,
  statusToEstado,
  type ReservationType,
  type ReservationStatus,
  type Servicio,
  type ReservacionEstado,
} from "@/lib/labels";
import { nuevoPerroSchema, type ClienteInput, type PerroInput } from "@/lib/validations/perro";
import {
  parseDewormings,
  parseVaccines,
  type DewormingInput,
  type DewormingType,
  type VaccineInput,
} from "@/lib/validations/salud";
import { timestampDeFecha, fechaDeTimestamp } from "@/lib/reservacion";

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
      cartilla_vigente: g("perro.cartilla_vigente"),
    },
  };
}

// El domicilio se guarda a nivel del dueño (users.address + coordenadas), no en
// pets. Llega como campos planos del FormData (lo captura DomicilioPicker con
// Google Places). Si no hay dirección, todo queda null.
function leerDomicilio(formData: FormData): {
  address: string | null;
  addressLat: number | null;
  addressLng: number | null;
  addressPlaceId: string | null;
} {
  const s = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
  };
  const num = (k: string) => {
    const v = s(k);
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const address = s("domicilio");
  if (!address) return { address: null, addressLat: null, addressLng: null, addressPlaceId: null };
  return {
    address,
    addressLat: num("domicilioLat"),
    addressLng: num("domicilioLng"),
    addressPlaceId: s("domicilioPlaceId"),
  };
}

// --------------------------------------------------------------------------
// Mapeo FORM (español) → columnas de las tablas unificadas (inglés).
// --------------------------------------------------------------------------

// users (cliente con role='OWNER'). `id`/`updatedAt` no tienen default en la BD,
// así que los generamos aquí. `notas` del cliente NO tiene columna en users → se
// ignora. `lastName` es un placeholder "—" (el nombre completo va en firstName).
function clienteAUsuario(cliente: ClienteInput, domicilio: ReturnType<typeof leerDomicilio>) {
  const email = cliente.email?.trim() || `walkin+${crypto.randomUUID()}@holidoginn.local`;
  return {
    id: crypto.randomUUID(),
    firstName: cliente.nombre,
    lastName: "—",
    phone: cliente.telefono ?? null,
    email,
    role: "OWNER" as const,
    address: domicilio.address,
    addressLat: domicilio.addressLat,
    addressLng: domicilio.addressLng,
    addressPlaceId: domicilio.addressPlaceId,
    updatedAt: new Date().toISOString(),
  };
}

// pets. `size` SIEMPRE se computa del peso (default "M" si null); si no hay peso
// pero el usuario eligió talla a mano, respetamos esa selección. `sexo` → sex
// ("M"/"F"). `cartilla_vigente` → cartillaStatus ("APPROVED" | null). Campos sin
// equivalente en el esquema NUEVO de `pets` (cartilla_vence, desparasitacion_*,
// domicilio) se IGNORAN: viven en tablas/columnas legacy en español (`perros`,
// `dewormings`, `vaccines`) que el web-admin ya no escribe. Conectarlos exigiría
// migrar el schema compartido con la app móvil (ver nota en PerroForm).
// `veterinario`→vetName, `esterilizado`→isNeutered (no listados en el brief pero
// existen en pets; se mapean y queda documentado).
function perroAMascota(perro: PerroInput) {
  const tallaManual = (perro.talla ?? null) as PetSize | null;
  const size: PetSize = perro.peso_kg != null ? calcularSize(perro.peso_kg) : (tallaManual ?? "M");

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
    cartillaStatus: (perro.cartilla_vigente ? "APPROVED" : null) as "APPROVED" | null,
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

// Sincroniza las desparasitaciones del perro (tabla `dewormings`, compartida con
// la app móvil) con la lista que llega del formulario. `dewormings` es el estado
// deseado completo: se actualizan los que traen `id`, se insertan los nuevos y
// se borran los que el usuario quitó. No bloquea el guardado del perro: si algo
// falla, se loguea y se sigue. Las fechas "YYYY-MM-DD" se anclan a mediodía UTC.
async function sincronizarDewormings(
  supabase: DB,
  petId: string,
  dewormings: DewormingInput[],
): Promise<void> {
  const { data: existentes, error } = await supabase
    .from("dewormings")
    .select("id")
    .eq("petId", petId);
  if (error) {
    console.error("[perros] Error al leer desparasitaciones:", error);
    return;
  }

  const idsActuales = new Set((existentes ?? []).map((d) => d.id));
  const idsDeseados = new Set(
    dewormings.map((d) => d.id).filter((id): id is string => Boolean(id)),
  );

  // 1) Borrar los registros que el usuario quitó del formulario.
  const aBorrar = [...idsActuales].filter((id) => !idsDeseados.has(id));
  if (aBorrar.length > 0) {
    const { error: delErr } = await supabase.from("dewormings").delete().in("id", aBorrar);
    if (delErr) console.error("[perros] Error al borrar desparasitaciones:", delErr);
  }

  // 2) Actualizar los existentes e insertar los nuevos.
  for (const d of dewormings) {
    const appliedAt = timestampDeFecha(d.appliedAt);
    if (!appliedAt) continue; // appliedAt es obligatorio en el schema; guard defensivo.
    const fila = {
      type: d.type,
      productName: d.productName ?? null,
      appliedAt,
      expiresAt: timestampDeFecha(d.expiresAt),
      vetName: d.vetName ?? null,
      notes: d.notes ?? null,
    };
    if (d.id && idsActuales.has(d.id)) {
      const { error: upErr } = await supabase.from("dewormings").update(fila).eq("id", d.id);
      if (upErr) console.error("[perros] Error al actualizar desparasitación:", upErr);
    } else {
      const { error: insErr } = await supabase
        .from("dewormings")
        .insert({ id: crypto.randomUUID(), petId, ...fila });
      if (insErr) console.error("[perros] Error al crear desparasitación:", insErr);
    }
  }
}

// Sincroniza las vacunas del perro (tabla `vaccines`) con la lista del
// formulario, igual que sincronizarDewormings. El `name` de cada vacuna SIEMPRE
// se deriva del catálogo (vaccine_catalog) en el servidor —no del cliente—, como
// en la app móvil; una fila con catalogId desconocido se omite.
async function sincronizarVaccines(
  supabase: DB,
  petId: string,
  vaccines: VaccineInput[],
): Promise<void> {
  const { data: existentes, error } = await supabase
    .from("vaccines")
    .select("id")
    .eq("petId", petId);
  if (error) {
    console.error("[perros] Error al leer vacunas:", error);
    return;
  }

  // Nombre de cada vacuna desde el catálogo (id → displayName).
  const catalogIds = [...new Set(vaccines.map((v) => v.catalogId))];
  const nombrePorCatalogo = new Map<string, string>();
  if (catalogIds.length > 0) {
    const { data: catalogo } = await supabase
      .from("vaccine_catalog")
      .select("id, displayName")
      .in("id", catalogIds);
    for (const c of catalogo ?? []) nombrePorCatalogo.set(c.id, c.displayName);
  }

  const idsActuales = new Set((existentes ?? []).map((v) => v.id));
  const idsDeseados = new Set(vaccines.map((v) => v.id).filter((id): id is string => Boolean(id)));

  // 1) Borrar las vacunas que el usuario quitó del formulario.
  const aBorrar = [...idsActuales].filter((id) => !idsDeseados.has(id));
  if (aBorrar.length > 0) {
    const { error: delErr } = await supabase.from("vaccines").delete().in("id", aBorrar);
    if (delErr) console.error("[perros] Error al borrar vacunas:", delErr);
  }

  // 2) Actualizar las existentes e insertar las nuevas.
  for (const v of vaccines) {
    const appliedAt = timestampDeFecha(v.appliedAt);
    const name = nombrePorCatalogo.get(v.catalogId);
    if (!appliedAt || !name) continue; // catalogId/fecha inválidos: se omite.
    const fila = {
      name,
      catalogId: v.catalogId,
      appliedAt,
      expiresAt: timestampDeFecha(v.expiresAt),
      vetName: v.vetName ?? null,
    };
    if (v.id && idsActuales.has(v.id)) {
      const { error: upErr } = await supabase.from("vaccines").update(fila).eq("id", v.id);
      if (upErr) console.error("[perros] Error al actualizar vacuna:", upErr);
    } else {
      const { error: insErr } = await supabase
        .from("vaccines")
        .insert({ id: crypto.randomUUID(), petId, ...fila });
      if (insErr) console.error("[perros] Error al crear vacuna:", insErr);
    }
  }
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
  const domicilio = leerDomicilio(formData);

  return withSupabase("perros", async (supabase) => {
    // 1) Fotos (opcionales): la del perro y la de la cartilla.
    const fotoFile = archivoDeFormData(formData, "foto");
    const cartillaFile = archivoDeFormData(formData, "cartilla");
    const photoUrl = fotoFile ? await subirFoto(supabase, fotoFile) : null;
    const cartillaUrl = cartillaFile ? await subirFoto(supabase, cartillaFile, "cartillas/") : null;

    // 2) Cliente (users, role='OWNER'), con su domicilio para servicio a domicilio.
    const { data: clienteRow, error: clienteErr } = await supabase
      .from("users")
      .insert(clienteAUsuario(cliente, domicilio))
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

    await sincronizarDewormings(supabase, perroRow.id, parseDewormings(formData.get("dewormings")));
    await sincronizarVaccines(supabase, perroRow.id, parseVaccines(formData.get("vaccines")));

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
  const domicilio = leerDomicilio(formData);

  return withSupabase("perros", async (supabase) => {
    const fotoFile = archivoDeFormData(formData, "foto");
    const cartillaFile = archivoDeFormData(formData, "cartilla");
    const photoUrl = fotoFile ? await subirFoto(supabase, fotoFile) : null;
    const cartillaUrl = cartillaFile ? await subirFoto(supabase, cartillaFile, "cartillas/") : null;

    // Cliente (users). `notas` se ignora (no hay columna). `id`/role no se tocan.
    // El domicilio (con coordenadas) se actualiza para el servicio a domicilio.
    const { error: clienteErr } = await supabase
      .from("users")
      .update({
        firstName: cliente.nombre,
        phone: cliente.telefono ?? null,
        email: cliente.email?.trim() || undefined,
        address: domicilio.address,
        addressLat: domicilio.addressLat,
        addressLng: domicilio.addressLng,
        addressPlaceId: domicilio.addressPlaceId,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", clienteId);
    if (clienteErr) {
      console.error("[perros] Error al actualizar cliente:", clienteErr);
      return { ok: false, error: ERROR_GENERICO };
    }

    // Cartilla: la BD tiene 4 estados (PENDING/APPROVED/REJECTED/EXPIRED), varios
    // del flujo de revisión de la app móvil. El toggle del web es booleano, así
    // que NO debe colapsar esos estados a null. Regla no destructiva: ON →
    // APPROVED; OFF → solo limpia una aprobación previa (APPROVED), y conserva
    // los estados de revisión (PENDING/REJECTED/EXPIRED). (Bug reportado por Javi.)
    const { data: cartActual } = await supabase
      .from("pets")
      .select("cartillaStatus")
      .eq("id", perroId)
      .maybeSingle();
    const prevCartilla = cartActual?.cartillaStatus ?? null;
    const cartillaStatus = perro.cartilla_vigente
      ? "APPROVED"
      : prevCartilla === "APPROVED"
        ? null
        : prevCartilla;

    const { error: perroErr } = await supabase
      .from("pets")
      .update({
        ...perroAMascota(perro),
        cartillaStatus,
        updatedAt: new Date().toISOString(),
        ...(photoUrl ? { photoUrl } : {}),
        ...(cartillaUrl ? { cartillaUrl } : {}),
      })
      .eq("id", perroId);
    if (perroErr) {
      console.error("[perros] Error al actualizar perro:", perroErr);
      return { ok: false, error: ERROR_GENERICO };
    }

    await sincronizarDewormings(supabase, perroId, parseDewormings(formData.get("dewormings")));
    await sincronizarVaccines(supabase, perroId, parseVaccines(formData.get("vaccines")));

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
};

export type PerroReservacion = {
  id: string;
  servicio: Servicio;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: ReservacionEstado;
  precio_acordado: number | null;
};

// Desparasitación leída de la tabla `dewormings` (fechas en "YYYY-MM-DD").
export type PerroDeworming = {
  id: string;
  type: DewormingType;
  productName: string | null;
  appliedAt: string | null;
  expiresAt: string | null;
};

// Vacuna leída de la tabla `vaccines` (fechas en "YYYY-MM-DD").
export type PerroVacuna = {
  id: string;
  nombre: string;
  appliedAt: string | null;
  expiresAt: string | null;
};

export type PerroDetalle = {
  perro: PerroFicha;
  cliente: { nombre: string; telefono: string | null } | null;
  reservaciones: PerroReservacion[];
  dewormings: PerroDeworming[];
  vaccines: PerroVacuna[];
};

export async function obtenerDetallePerro(perroId: string): Promise<ActionResult<PerroDetalle>> {
  return withSupabase("perros", async (supabase) => {
    const { data: perro, error } = await supabase
      .from("pets")
      .select(
        "id, nombre:name, raza:breed, sexo:sex, talla:size, fecha_nacimiento:birthDate, peso_kg:weight, veterinario:vetName, esterilizado:isNeutered, alergias:healthIssues, comportamiento:behavior, notas:notes, foto_url:photoUrl, cartilla_foto_url:cartillaUrl, cartillaStatus, cliente:users!pets_ownerId_fkey(nombre:firstName, telefono:phone, domicilio:address)",
      )
      .eq("id", perroId)
      .maybeSingle();
    if (error || !perro) {
      console.error("[perros] Error al cargar ficha:", error);
      return { ok: false, error: "No se pudo cargar el perro." };
    }

    const cliente = perro.cliente as {
      nombre: string;
      telefono: string | null;
      domicilio: string | null;
    } | null;

    // cartilla_vigente se deriva de cartillaStatus === "APPROVED". El domicilio
    // vive en el dueño (users.address). Desparasitaciones y vacunas se leen
    // aparte de sus tablas (`dewormings`, `vaccines`).
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
      domicilio: cliente?.domicilio ?? null,
      foto_url: perro.foto_url,
      cartilla_foto_url: perro.cartilla_foto_url,
      cartilla_vigente: perro.cartillaStatus === "APPROVED",
    };

    const [{ data: reservaciones }, { data: dewormings }, { data: vaccines }] = await Promise.all([
      supabase
        .from("reservations")
        .select(
          "id, servicio:reservationType, fecha_inicio:checkIn, fecha_fin:checkOut, estado:status, precio_acordado:totalAmount",
        )
        .eq("petId", perroId)
        .order("checkIn", { ascending: false })
        .limit(5),
      supabase
        .from("dewormings")
        .select("id, type, productName, appliedAt, expiresAt")
        .eq("petId", perroId)
        .order("appliedAt", { ascending: false }),
      supabase
        .from("vaccines")
        .select("id, name, appliedAt, expiresAt")
        .eq("petId", perroId)
        .order("appliedAt", { ascending: false }),
    ]);

    // Traducimos servicio/estado de los enums en inglés al español del UI.
    const reservacionesUi: PerroReservacion[] = (reservaciones ?? []).map((r) => ({
      id: r.id,
      servicio: typeToServicio(r.servicio as ReservationType),
      fecha_inicio: r.fecha_inicio ?? "",
      fecha_fin: r.fecha_fin,
      estado: statusToEstado(r.estado as ReservationStatus),
      precio_acordado: r.precio_acordado,
    }));

    const dewormingsUi: PerroDeworming[] = (dewormings ?? []).map((d) => ({
      id: d.id,
      type: d.type,
      productName: d.productName,
      appliedAt: fechaDeTimestamp(d.appliedAt),
      expiresAt: fechaDeTimestamp(d.expiresAt),
    }));

    const vaccinesUi: PerroVacuna[] = (vaccines ?? []).map((v) => ({
      id: v.id,
      nombre: v.name,
      appliedAt: fechaDeTimestamp(v.appliedAt),
      expiresAt: fechaDeTimestamp(v.expiresAt),
    }));

    return {
      ok: true,
      data: {
        perro: ficha,
        cliente,
        reservaciones: reservacionesUi,
        dewormings: dewormingsUi,
        vaccines: vaccinesUi,
      },
    };
  });
}

// Elimina un perro y todo lo que cuelga de él. La DB compartida con la app móvil
// NO tiene ON DELETE CASCADE en estas FK, así que borramos a mano y en orden:
// primero los hijos de sus reservaciones, luego las reservaciones, luego los hijos
// directos del perro y al final el perro. Borrar de una tabla vacía es un no-op.
export async function eliminarPerro(perroId: string): Promise<ActionResult<null>> {
  return withSupabase("perros", async (supabase) => {
    const { data: resvs, error: eRes } = await supabase
      .from("reservations")
      .select("id")
      .eq("petId", perroId);
    if (eRes) {
      console.error("[perros] Error al leer reservaciones del perro:", eRes);
      return { ok: false, error: ERROR_GENERICO };
    }
    const resIds = (resvs ?? []).map((r) => r.id);

    const pasos: {
      etiqueta: string;
      ejecutar: PromiseLike<{ error: { message: string } | null }>;
    }[] = [];

    // 1) Hijos de las reservaciones del perro (addons referencian payments → primero).
    if (resIds.length > 0) {
      pasos.push(
        {
          etiqueta: "reservation_addons",
          ejecutar: supabase.from("reservation_addons").delete().in("reservationId", resIds),
        },
        {
          etiqueta: "payments",
          ejecutar: supabase.from("payments").delete().in("reservationId", resIds),
        },
        {
          etiqueta: "daily_checklists",
          ejecutar: supabase.from("daily_checklists").delete().in("reservationId", resIds),
        },
        {
          etiqueta: "reviews",
          ejecutar: supabase.from("reviews").delete().in("reservationId", resIds),
        },
        {
          etiqueta: "staff_alerts(resv)",
          ejecutar: supabase.from("staff_alerts").delete().in("reservationId", resIds),
        },
        {
          etiqueta: "stay_updates(resv)",
          ejecutar: supabase.from("stay_updates").delete().in("reservationId", resIds),
        },
        {
          etiqueta: "reservation_change_requests",
          ejecutar: supabase
            .from("reservation_change_requests")
            .delete()
            .in("reservationId", resIds),
        },
      );
    }

    // 2) Las reservaciones.
    pasos.push({
      etiqueta: "reservations",
      ejecutar: supabase.from("reservations").delete().eq("petId", perroId),
    });

    // 3) Hijos directos del perro.
    pasos.push(
      {
        etiqueta: "dewormings",
        ejecutar: supabase.from("dewormings").delete().eq("petId", perroId),
      },
      { etiqueta: "vaccines", ejecutar: supabase.from("vaccines").delete().eq("petId", perroId) },
      {
        etiqueta: "behavior_tags",
        ejecutar: supabase.from("behavior_tags").delete().eq("petId", perroId),
      },
      {
        etiqueta: "staff_alerts(pet)",
        ejecutar: supabase.from("staff_alerts").delete().eq("petId", perroId),
      },
      {
        etiqueta: "stay_updates(pet)",
        ejecutar: supabase.from("stay_updates").delete().eq("petId", perroId),
      },
    );

    for (const { etiqueta, ejecutar } of pasos) {
      const { error } = await ejecutar;
      if (error) {
        console.error(`[perros] Error al borrar ${etiqueta}:`, error);
        return { ok: false, error: ERROR_GENERICO };
      }
    }

    // 4) El perro.
    const { error } = await supabase.from("pets").delete().eq("id", perroId);
    if (error) {
      console.error("[perros] Error al eliminar perro:", error);
      return { ok: false, error: ERROR_GENERICO };
    }
    revalidatePath("/perros");
    return { ok: true, data: null };
  });
}
