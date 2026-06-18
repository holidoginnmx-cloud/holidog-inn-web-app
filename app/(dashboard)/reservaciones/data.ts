import { createSupabaseServerClient } from "@/lib/supabase/server";
import { typeToServicio, statusToEstado, type PetSize } from "@/lib/labels";
import type { Enums } from "@/lib/supabase/types";
import type { ResvLite } from "@/lib/ocupacion";
import type { ComboOption } from "@/components/domain/Combobox";
import type { Tarifas } from "@/lib/tarifas";
import { MARCA_REVISAR_PERRO, type Talla } from "@/lib/perro";
import { fechaDeTimestamp } from "@/lib/reservacion";
import { one } from "@/lib/supabase/helpers";

// PetSize (esquema unificado) -> Talla legacy, para reutilizar la lógica de
// peso/talla del formulario y la sugerencia de precio sin cambiar el UI.
const PETSIZE_TO_TALLA: Record<PetSize, Talla> = {
  XS: "EXTRA_CHICO",
  S: "CHICO",
  M: "MEDIANO",
  L: "GRANDE",
  XL: "GRANDE",
};

// Datos compartidos por los formularios de reservación (crear / editar):
// catálogo de perros, reservaciones que ocupan cupo (para el warning) y cupo.
export async function cargarDatosFormReservacion(): Promise<{
  perros: ComboOption[];
  reservacionesActivas: ResvLite[];
  cupo: number;
  pesoPorPerro: Record<string, number | null>;
  tallaPorPerro: Record<string, Talla | null>;
  tarifas: Tarifas;
}> {
  const supabase = createSupabaseServerClient();

  const [cfgRes, perrosRes, resvRes, lodgingRes, variantsRes] = await Promise.all([
    supabase
      .from("hotel_config")
      .select("cupo_maximo:maxCapacity")
      .eq("id", "singleton")
      .maybeSingle(),
    supabase
      .from("pets")
      .select(
        "id, nombre:name, peso_kg:weight, talla:size, notas:notes, owner:users!pets_ownerId_fkey(nombre:firstName)",
      )
      .order("name"),
    supabase
      .from("reservations")
      .select(
        "id, perro_id:petId, reservationType, fecha_inicio:checkIn, fecha_fin:checkOut, appointmentAt, status, pet:pets(nombre:name)",
      )
      // STAY + DAYCARE ocupan cupo; CONFIRMED/CHECKED_IN están vigentes.
      .in("reservationType", ["STAY", "DAYCARE"])
      .in("status", ["CONFIRMED", "CHECKED_IN"]),
    supabase
      .from("lodging_pricing")
      .select(
        "pricePerDaySmall, pricePerDayLarge, priceProbarfSmall, priceProbarfLarge, daycarePricePerDay, largeWeightKg",
      )
      .eq("id", "singleton")
      .maybeSingle(),
    supabase
      .from("service_variants")
      .select("petSize, price, corte, deslanado, isActive, serviceType:service_types(code)"),
  ]);

  const perrosVisibles = (perrosRes.data ?? [])
    // Ocultamos los placeholders "REVISAR": no se debe agendar bajo un registro basura.
    .filter((p) => p.notas !== MARCA_REVISAR_PERRO);

  const perros: ComboOption[] = perrosVisibles.map((p) => ({
    value: p.id,
    label: p.nombre,
    sublabel: (one(p.owner) as { nombre: string } | null)?.nombre,
  }));

  // Mapas perro → peso / talla, para sugerir el precio. El peso manda; si no hay
  // peso, se usa el badge de talla (convertido de PetSize a Talla legacy).
  const pesoPorPerro: Record<string, number | null> = {};
  const tallaPorPerro: Record<string, Talla | null> = {};
  for (const p of perrosVisibles) {
    pesoPorPerro[p.id] = p.peso_kg ?? null;
    const size = p.talla as PetSize | null;
    tallaPorPerro[p.id] = size ? PETSIZE_TO_TALLA[size] : null;
  }

  // Estética: precio base de baño por talla. Preferimos la variante base (sin
  // corte ni deslanado) y, a igualdad, la más barata.
  const esteticaPorTalla: Partial<Record<PetSize, number>> = {};
  const esteticaEsBase: Partial<Record<PetSize, boolean>> = {};
  for (const v of variantsRes.data ?? []) {
    if (v.isActive === false) continue;
    const code = (one(v.serviceType) as { code: string } | null)?.code;
    if (code !== "BATH") continue;
    const size = v.petSize as PetSize;
    const price = Number(v.price);
    const esBase = !v.corte && !v.deslanado;
    const actual = esteticaPorTalla[size];
    const actualEsBase = esteticaEsBase[size] ?? false;
    // Gana la variante base; entre dos del mismo tipo, la más barata.
    const reemplaza =
      actual == null || (esBase && !actualEsBase) || (esBase === actualEsBase && price < actual);
    if (reemplaza) {
      esteticaPorTalla[size] = price;
      esteticaEsBase[size] = esBase;
    }
  }

  const lp = lodgingRes.data;
  const tarifas: Tarifas = {
    pricePerDaySmall: Number(lp?.pricePerDaySmall ?? 0),
    pricePerDayLarge: Number(lp?.pricePerDayLarge ?? 0),
    priceProbarfSmall: Number(lp?.priceProbarfSmall ?? 0),
    priceProbarfLarge: Number(lp?.priceProbarfLarge ?? 0),
    daycarePricePerDay: Number(lp?.daycarePricePerDay ?? 0),
    largeWeightKg: Number(lp?.largeWeightKg ?? 20),
    esteticaPorTalla,
  };

  const reservacionesActivas: ResvLite[] = (resvRes.data ?? []).map((r) => {
    const tipo = r.reservationType as Enums<"ReservationType">;
    const servicio = typeToServicio(tipo);
    // STAY: checkIn/checkOut. DAYCARE: appointmentAt (de un día).
    const inicio = tipo === "STAY" ? r.fecha_inicio : r.appointmentAt;
    const fin = tipo === "STAY" ? r.fecha_fin : null;
    return {
      id: r.id,
      perroId: r.perro_id,
      perroNombre: (one(r.pet) as { nombre: string } | null)?.nombre ?? null,
      servicio,
      fecha_inicio: fechaDeTimestamp(inicio) ?? "",
      fecha_fin: fechaDeTimestamp(fin),
      estado: statusToEstado(r.status as Enums<"ReservationStatus">),
    };
  });

  return {
    perros,
    reservacionesActivas,
    cupo: cfgRes.data?.cupo_maximo ?? 20,
    pesoPorPerro,
    tallaPorPerro,
    tarifas,
  };
}
