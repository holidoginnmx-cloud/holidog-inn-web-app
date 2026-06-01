import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MESES = [
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
  "MAYO",
  "JUNIO",
  "JULIO",
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
];

function mesNombre(iso: string): string {
  const m = Number(iso.slice(5, 7));
  return MESES[m - 1] ?? "";
}

function one<T>(x: T | T[] | null | undefined): T | null {
  if (x == null) return null;
  return Array.isArray(x) ? (x[0] ?? null) : x;
}

// Exporta TODO a un .xlsx que replica la estructura del Excel original:
// hoja "2026" con ingresos en columnas A-F y egresos en I-N (encabezados fila 8).
export async function GET() {
  let supabase;
  try {
    supabase = createSupabaseServerClient();
  } catch (e) {
    console.error("[export] Supabase no configurado:", e);
    return NextResponse.json({ error: "Base de datos no configurada" }, { status: 500 });
  }

  const [pagosRes, egresosRes] = await Promise.all([
    supabase
      .from("pagos")
      .select("fecha, monto, descripcion, reservacion:reservaciones(servicio)")
      .order("fecha", { ascending: true }),
    supabase
      .from("egresos")
      .select("fecha, descripcion, monto, categoria, tipo_costo")
      .order("fecha", { ascending: true }),
  ]);

  if (pagosRes.error || egresosRes.error) {
    console.error("[export] Error al leer datos:", pagosRes.error ?? egresosRes.error);
    return NextResponse.json({ error: "No se pudieron leer los datos" }, { status: 500 });
  }

  const pagos = pagosRes.data ?? [];
  const egresos = egresosRes.data ?? [];

  // AOA: filas 1-7 vacías, fila 8 encabezados, datos desde fila 9 (como el original).
  const aoa: (string | number | null)[][] = [];
  for (let i = 0; i < 7; i++) aoa.push([]);
  aoa.push([
    "FECHA",
    "MES_NUM",
    "MES",
    "DESCRIPCION",
    "MONTO",
    "SERVICIO",
    null,
    null,
    "FECHA",
    "MES",
    "DESCRIPCION",
    "MONTO",
    "CATEGORIA",
    "TIPO DE COSTO",
  ]);

  const filas = Math.max(pagos.length, egresos.length);
  for (let i = 0; i < filas; i++) {
    const row: (string | number | null)[] = new Array(14).fill(null);
    const p = pagos[i];
    if (p) {
      const servicio = (one(p.reservacion) as { servicio: string } | null)?.servicio ?? "";
      row[0] = p.fecha;
      row[1] = Number(p.fecha.slice(5, 7));
      row[2] = mesNombre(p.fecha);
      row[3] = p.descripcion ?? "";
      row[4] = p.monto;
      row[5] = servicio;
    }
    const e = egresos[i];
    if (e) {
      row[8] = e.fecha;
      row[9] = mesNombre(e.fecha);
      row[10] = e.descripcion;
      row[11] = e.monto;
      row[12] = e.categoria;
      row[13] = e.tipo_costo;
    }
    aoa.push(row);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  // Forzar el rango desde A1 para conservar las 7 filas vacías de cabecera. Sin
  // esto, aoa_to_sheet arranca el !ref en la primera fila no vacía (A8) y un
  // re-import por el wizard (que hace slice(8)) perdería las primeras filas.
  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: aoa.length - 1, c: 13 } });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "2026");
  const buffer: Buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const fecha = new Date().toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="holidog-inn-export-${fecha}.xlsx"`,
    },
  });
}
