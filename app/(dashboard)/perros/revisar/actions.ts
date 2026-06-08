"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, type DB, withSupabase } from "@/lib/actions";
import { MARCA_REVISAR_PERRO } from "@/lib/perro";

const ERROR_GENERICO = "No se pudo completar. Intenta de nuevo.";

// Lee el placeholder y valida que de verdad sea un "REVISAR". Devuelve su ownerId.
async function leerPlaceholder(supabase: DB, perroId: string): Promise<string | null | "error"> {
  const { data, error } = await supabase
    .from("pets")
    .select("ownerId, notas:notes")
    .eq("id", perroId)
    .maybeSingle();
  if (error || !data) {
    console.error("[revisar] No se encontró el placeholder:", error);
    return "error";
  }
  if (data.notas !== MARCA_REVISAR_PERRO) {
    console.error("[revisar] El perro no es un placeholder de revisión:", perroId);
    return "error";
  }
  return data.ownerId;
}

// Si el cliente ya no tiene perros, lo borramos (los placeholder son 1 cliente : 1 perro).
async function borrarClienteSiHuerfano(supabase: DB, clienteId: string): Promise<void> {
  const { count, error } = await supabase
    .from("pets")
    .select("id", { count: "exact", head: true })
    .eq("ownerId", clienteId);
  if (error) {
    console.error("[revisar] Error al contar perros del cliente:", error);
    return;
  }
  if ((count ?? 0) === 0) {
    await supabase.from("users").delete().eq("id", clienteId);
  }
}

function revalidar() {
  revalidatePath("/perros");
  revalidatePath("/perros/revisar");
  revalidatePath("/clientes");
}

// --------------------------------------------------------------------------
// Reasignar: mueve las reservaciones del placeholder a un perro real y borra
// el placeholder (y su cliente huérfano). No se pierde ningún pago.
// --------------------------------------------------------------------------
export async function reasignarPlaceholder(
  placeholderId: string,
  realPerroId: string,
): Promise<ActionResult<null>> {
  if (placeholderId === realPerroId) {
    return { ok: false, error: "Elige un perro distinto." };
  }

  return withSupabase("revisar", async (supabase) => {
    const clienteId = await leerPlaceholder(supabase, placeholderId);
    if (clienteId === "error") return { ok: false, error: ERROR_GENERICO };

    // 1) Mover las reservaciones al perro real.
    const { error: updErr } = await supabase
      .from("reservations")
      .update({ petId: realPerroId })
      .eq("petId", placeholderId);
    if (updErr) {
      console.error("[revisar] Error al mover reservaciones:", updErr);
      return { ok: false, error: ERROR_GENERICO };
    }

    // 2) Borrar el placeholder (ya sin reservaciones colgando).
    const { error: delErr } = await supabase.from("pets").delete().eq("id", placeholderId);
    if (delErr) {
      console.error("[revisar] Error al borrar el placeholder:", delErr);
      return { ok: false, error: ERROR_GENERICO };
    }

    // 3) Limpiar el cliente placeholder si quedó huérfano.
    if (clienteId) await borrarClienteSiHuerfano(supabase, clienteId);

    revalidar();
    revalidatePath(`/perros/${realPerroId}`);
    return { ok: true, data: null };
  });
}

// --------------------------------------------------------------------------
// Eliminar: borra el placeholder y, en cascada, sus reservaciones y pagos.
// ⚠️ Se pierde ese historial de pagos. Solo para registros basura.
// --------------------------------------------------------------------------
export async function eliminarPlaceholder(placeholderId: string): Promise<ActionResult<null>> {
  return withSupabase("revisar", async (supabase) => {
    const clienteId = await leerPlaceholder(supabase, placeholderId);
    if (clienteId === "error") return { ok: false, error: ERROR_GENERICO };

    const { error } = await supabase.from("pets").delete().eq("id", placeholderId);
    if (error) {
      console.error("[revisar] Error al eliminar el placeholder:", error);
      return { ok: false, error: ERROR_GENERICO };
    }

    if (clienteId) await borrarClienteSiHuerfano(supabase, clienteId);

    revalidar();
    return { ok: true, data: null };
  });
}
