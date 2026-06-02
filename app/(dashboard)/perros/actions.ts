"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, type DB, ERROR_GENERICO, validar, withSupabase } from "@/lib/actions";
import type { Database } from "@/lib/supabase/types";
import { nuevoPerroSchema } from "@/lib/validations/perro";

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
      cartilla_vence: g("perro.cartilla_vence"),
    },
  };
}

// Sube la foto (ya comprimida en cliente) al bucket público y devuelve su URL.
async function subirFoto(supabase: DB, file: File): Promise<string | null> {
  const ext = file.type === "image/webp" ? "webp" : "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) {
    console.error("[perros] Error al subir foto:", error);
    return null;
  }
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function fotoDeFormData(formData: FormData): File | null {
  const foto = formData.get("foto");
  return foto instanceof File && foto.size > 0 ? foto : null;
}

// --------------------------------------------------------------------------
// Alta: crea Cliente + Perro en una sola operación.
// --------------------------------------------------------------------------
export async function crearClienteYPerro(
  formData: FormData,
): Promise<ActionResult<{ perroId: string }>> {
  const v = validar(nuevoPerroSchema, leerFormData(formData));
  if (!v.ok) return v;
  const { cliente, perro } = v.data;

  return withSupabase("perros", async (supabase) => {
    // 1) Foto (opcional).
    const file = fotoDeFormData(formData);
    const foto_url = file ? await subirFoto(supabase, file) : null;

    // 2) Cliente.
    const { data: clienteRow, error: clienteErr } = await supabase
      .from("clientes")
      .insert(cliente)
      .select("id")
      .single();
    if (clienteErr || !clienteRow) {
      console.error("[perros] Error al crear cliente:", clienteErr);
      return { ok: false, error: ERROR_GENERICO };
    }

    // 3) Perro (ligado al cliente). La talla la calcula la BD.
    const { data: perroRow, error: perroErr } = await supabase
      .from("perros")
      .insert({ ...perro, cliente_id: clienteRow.id, foto_url })
      .select("id")
      .single();
    if (perroErr || !perroRow) {
      console.error("[perros] Error al crear perro:", perroErr);
      // Limpieza: evitar un cliente huérfano si el perro no se pudo crear.
      await supabase.from("clientes").delete().eq("id", clienteRow.id);
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
    const file = fotoDeFormData(formData);
    const foto_url = file ? await subirFoto(supabase, file) : null;

    const { error: clienteErr } = await supabase
      .from("clientes")
      .update(cliente)
      .eq("id", clienteId);
    if (clienteErr) {
      console.error("[perros] Error al actualizar cliente:", clienteErr);
      return { ok: false, error: ERROR_GENERICO };
    }

    const { error: perroErr } = await supabase
      .from("perros")
      .update({ ...perro, ...(foto_url ? { foto_url } : {}) })
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
type PerroRow = Database["public"]["Tables"]["perros"]["Row"];

export type PerroReservacion = {
  id: string;
  servicio: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: string;
  precio_acordado: number | null;
};

export type PerroDetalle = {
  perro: PerroRow;
  cliente: { nombre: string; telefono: string | null } | null;
  reservaciones: PerroReservacion[];
};

export async function obtenerDetallePerro(perroId: string): Promise<ActionResult<PerroDetalle>> {
  return withSupabase("perros", async (supabase) => {
    const { data: perro, error } = await supabase
      .from("perros")
      .select("*, cliente:clientes(*)")
      .eq("id", perroId)
      .maybeSingle();
    if (error || !perro) {
      console.error("[perros] Error al cargar ficha:", error);
      return { ok: false, error: "No se pudo cargar el perro." };
    }

    const cliente = perro.cliente as { nombre: string; telefono: string | null } | null;
    const { cliente: _omit, ...perroSolo } = perro;

    const { data: reservaciones } = await supabase
      .from("reservaciones")
      .select("id, servicio, fecha_inicio, fecha_fin, estado, precio_acordado")
      .eq("perro_id", perroId)
      .order("fecha_inicio", { ascending: false })
      .limit(5);

    return {
      ok: true,
      data: {
        perro: perroSolo as PerroRow,
        cliente,
        reservaciones: (reservaciones ?? []) as PerroReservacion[],
      },
    };
  });
}

// Elimina un perro (cascada borra sus reservaciones y pagos por FK).
export async function eliminarPerro(perroId: string): Promise<ActionResult<null>> {
  return withSupabase("perros", async (supabase) => {
    const { error } = await supabase.from("perros").delete().eq("id", perroId);
    if (error) {
      console.error("[perros] Error al eliminar perro:", error);
      return { ok: false, error: ERROR_GENERICO };
    }
    revalidatePath("/perros");
    return { ok: true, data: null };
  });
}
