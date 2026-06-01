import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MARCA_REVISAR_PERRO } from "@/lib/perro";
import { RevisionPanel, type PlaceholderItem, type PerroOpcion } from "@/components/domain/RevisionPanel";

export const dynamic = "force-dynamic";

const SERVICIO_LABEL: Record<string, string> = {
  HOTEL: "Hotel",
  ESTETICA: "Estética",
  GUARDERIA: "Guardería",
};

type PagoEmbed = { monto: number | null };
type ReservacionEmbed = {
  servicio: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  pagos: PagoEmbed[] | null;
};

// --- Sugerencias automáticas (matching difuso, confirmado por el usuario) ----

const STOPWORDS = new Set([
  "Y", "DE", "LA", "EL", "DEL", "CON", "LOS", "LAS",
  "GUARDERIA", "HOTEL", "ESTETICA", "ESTET", "ANTICIPO", "ANICIPO", "RESTANTE", "ABONO", "PAGO",
]);

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function palabras(s: string): string[] {
  return normalizar(s)
    .split(" ")
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

type OpcionIndexada = PerroOpcion & { norm: string; toks: string[] };

// Devuelve hasta 3 perros reales más probables para un nombre sucio de placeholder.
function sugerirPerros(nombrePlaceholder: string, indexadas: OpcionIndexada[]): PerroOpcion[] {
  const phNorm = normalizar(nombrePlaceholder);
  const phSet = new Set(palabras(nombrePlaceholder));
  const scored: { o: PerroOpcion; score: number }[] = [];

  for (const o of indexadas) {
    let score = 0;
    if (o.norm.length >= 3 && phSet.has(o.norm)) score += 100; // el nombre real es una palabra del sucio
    const compartidas = o.toks.filter((t) => phSet.has(t)).length;
    score += compartidas * 10;
    if (compartidas === 0 && o.norm.length >= 4 && phNorm.includes(o.norm)) score += 15; // substring
    if (score > 0) scored.push({ o, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map((s) => ({ id: s.o.id, nombre: s.o.nombre, clienteNombre: s.o.clienteNombre }));
}

export default async function RevisarPerrosPage() {
  let placeholders: PlaceholderItem[] = [];
  let opciones: PerroOpcion[] = [];
  let errorCarga = false;

  try {
    const supabase = createSupabaseServerClient();

    const [{ data: phData, error: phErr }, { data: realesData, error: realesErr }] =
      await Promise.all([
        supabase
          .from("perros")
          .select(
            "id, nombre, reservaciones(servicio, fecha_inicio, fecha_fin, pagos(monto))",
          )
          .eq("notas", MARCA_REVISAR_PERRO)
          .order("nombre", { ascending: true }),
        supabase
          .from("perros")
          .select("id, nombre, notas, cliente:clientes(nombre)")
          .order("nombre", { ascending: true }),
      ]);
    if (phErr) throw phErr;
    if (realesErr) throw realesErr;

    opciones = (realesData ?? [])
      .filter((p) => p.notas !== MARCA_REVISAR_PERRO)
      .map((p) => {
        const c = p.cliente as { nombre: string } | { nombre: string }[] | null;
        const cli = Array.isArray(c) ? (c[0] ?? null) : c;
        return { id: p.id, nombre: p.nombre, clienteNombre: cli?.nombre ?? null };
      });

    // Índice para el matching (tokens precomputados una sola vez).
    const indexadas: OpcionIndexada[] = opciones.map((o) => ({
      ...o,
      norm: normalizar(o.nombre),
      toks: palabras(o.nombre),
    }));

    placeholders = (phData ?? []).map((p) => {
      const reservaciones = (p.reservaciones ?? []) as ReservacionEmbed[];
      const total = reservaciones.reduce(
        (s, r) => s + (r.pagos ?? []).reduce((ss, pago) => ss + (pago.monto ?? 0), 0),
        0,
      );
      const servicios = [
        ...new Set(reservaciones.map((r) => SERVICIO_LABEL[r.servicio] ?? r.servicio)),
      ];
      const fechas = reservaciones.map((r) => r.fecha_inicio).filter(Boolean).sort();
      return {
        id: p.id,
        nombre: p.nombre,
        nReservaciones: reservaciones.length,
        total: Math.round(total * 100) / 100,
        servicios,
        desde: fechas[0] ?? null,
        hasta: fechas[fechas.length - 1] ?? null,
        sugerencias: sugerirPerros(p.nombre, indexadas),
      };
    });
  } catch (e) {
    console.error("[revisar] Error al cargar:", e);
    errorCarga = true;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href="/perros"
          aria-label="Volver"
          className="flex size-8 items-center justify-center rounded-md text-neutral-muted hover:bg-neutral-sand"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-ink">Perros por revisar</h1>
      </div>

      <p className="text-sm text-neutral-muted">
        Estos son pagos viejos del Excel que no se pudieron enlazar a un perro real (nombre repetido o
        sin ficha). Asígnalos al perro correcto, o elimínalos si son basura.
      </p>

      {errorCarga ? (
        <p className="bg-destructive/10 text-destructive rounded-md px-3 py-6 text-center text-sm">
          No se pudo cargar. Revisa la conexión a la base de datos.
        </p>
      ) : (
        <RevisionPanel placeholders={placeholders} opciones={opciones} />
      )}
    </div>
  );
}
