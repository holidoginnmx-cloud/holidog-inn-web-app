import * as XLSX from "xlsx";
import { MARCA_REVISAR_PERRO, MARCA_REVISAR_CLIENTE } from "@/lib/perro";

// Port de migrate_excel.py a TypeScript, extendido con el padrón real.
// - La hoja "2026" registra PAGOS individuales (col A-F) y EGRESOS (col I-N) desde la fila 9.
//   Pagos del MISMO perro + MISMO servicio + MISMO mes => 1 reservación legacy.
// - La hoja "BASE DE DATOS CLIENTES" es el padrón real (clientes + perros con atributos).
//   De ahí salen los clientes/perros limpios; los pagos se enlazan al perro real cuando
//   el nombre coincide de forma inequívoca, y lo que no se resuelve queda en placeholders
//   marcados para revisión manual. Ningún pago se pierde.

const SHEET_NAME = "2026";
const SHEET_PADRON = "BASE DE DATOS CLIENTES";

export type ClienteRow = {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  notas: string;
};
export type PerroRow = {
  id: string;
  cliente_id: string;
  nombre: string;
  raza: string | null;
  sexo: "MACHO" | "HEMBRA" | null;
  comportamiento: string | null;
  veterinario: string | null;
  esterilizado: boolean | null;
  talla: "CHICO" | "MEDIANO" | "GRANDE" | "GIGANTE" | null;
  notas: string;
};
export type ReservacionRow = {
  id: string;
  perro_id: string;
  servicio: string;
  fecha_inicio: string;
  fecha_fin: string;
  precio_acordado: number;
  anticipo_acordado: number;
  estado: string;
  notas: string;
};
export type PagoRow = {
  id: string;
  reservacion_id: string;
  monto: number;
  tipo: string;
  fecha: string;
  metodo_pago: string | null;
  descripcion: string;
};
export type EgresoRow = {
  id: string;
  fecha: string;
  descripcion: string;
  monto: number;
  categoria: string;
  tipo_costo: string;
  notas: string | null;
};

export type ResumenMigracion = {
  clientes: number;
  perros: number;
  perrosReales: number;
  perrosPlaceholder: number;
  reservaciones: number;
  reservacionesEnlazadas: number;
  reservacionesSinEnlace: number;
  pagos: number;
  egresos: number;
  totalIngresos: number;
  totalEgresos: number;
};

export type MigracionData = {
  clientes: ClienteRow[];
  perros: PerroRow[];
  reservaciones: ReservacionRow[];
  pagos: PagoRow[];
  egresos: EgresoRow[];
  resumen: ResumenMigracion;
};

const pad = (n: number) => String(n).padStart(2, "0");
const round2 = (n: number) => Math.round(n * 100) / 100;

// Fecha de Excel (serial o Date) → "YYYY-MM-DD". Epoch 1899-12-30, en UTC.
function excelToYMD(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) {
    return `${v.getUTCFullYear()}-${pad(v.getUTCMonth() + 1)}-${pad(v.getUTCDate())}`;
  }
  if (typeof v === "number") {
    const d = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86400000);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  }
  return null;
}

function normServicio(s: unknown): string {
  if (!s) return "HOTEL";
  const t = String(s).trim().toUpperCase();
  if (t.includes("ESTÉT") || t.includes("ESTET")) return "ESTETICA";
  if (t.includes("GUARDER")) return "GUARDERIA";
  return "HOTEL";
}

function normTipoCosto(t: unknown): string {
  if (!t) return "VARIABLE";
  const k = String(t).trim().toUpperCase();
  const m: Record<string, string> = {
    FIJO: "FIJO",
    FIJOS: "FIJO",
    VARIABLE: "VARIABLE",
    SUELDO: "SUELDO",
    MARKETING: "MARKETING",
    REINVERSIÓN: "REINVERSION",
    REINVERSION: "REINVERSION",
  };
  return m[k] ?? "VARIABLE";
}

function clasificarPagoTipo(descripcion: string): string {
  const d = (descripcion || "").toUpperCase();
  if (d.includes("ANTICIPO") || d.includes("ANICIPO")) return "ANTICIPO";
  if (d.includes("RESTANTE")) return "RESTANTE";
  return "ABONO";
}

function limpiarNombrePerro(descripcion: string): string {
  let d = (descripcion || "").trim().toUpperCase();
  for (const p of ["ANTICIPO ", "ANICIPO ", "RESTANTE ", "ANTICIPOS "]) {
    if (d.startsWith(p)) d = d.slice(p.length);
  }
  if (d.endsWith(" ANTICIPO")) d = d.slice(0, -" ANTICIPO".length);
  if (d.endsWith(" RESTANTE")) d = d.slice(0, -" RESTANTE".length);
  return d.trim();
}

const uuid = () => crypto.randomUUID();

// ---- Padrón real ("BASE DE DATOS CLIENTES") --------------------------------

// Normaliza un nombre para deduplicar clientes y emparejar perros: sin acentos,
// mayúsculas, espacios colapsados.
function normNombre(s: unknown): string {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

// Encuentra una hoja por nombre tolerando mayúsculas/acentos/espacios extra.
// Devuelve la hoja del libro, o null si no existe.
function buscarHoja(wb: XLSX.WorkBook, objetivo: string): XLSX.WorkSheet | null {
  const directa = wb.Sheets[objetivo];
  if (directa) return directa;
  const t = normNombre(objetivo);
  const real = wb.SheetNames.find((n) => normNombre(n) === t);
  return real ? (wb.Sheets[real] ?? null) : null;
}

// Teléfono: viene como number (6451133746) o texto; deja solo dígitos.
function limpiarTelefono(v: unknown): string | null {
  if (v == null || v === "") return null;
  const d = String(v).replace(/\D/g, "");
  return d.length ? d : null;
}

const TAMANO_A_TALLA: Record<string, PerroRow["talla"]> = {
  S: "CHICO",
  M: "MEDIANO",
  L: "GRANDE",
  XL: "GIGANTE",
};
function mapTalla(v: unknown): PerroRow["talla"] {
  const k = String(v ?? "").trim().toUpperCase();
  return TAMANO_A_TALLA[k] ?? null;
}
function mapSexo(v: unknown): PerroRow["sexo"] {
  const k = normNombre(v);
  return k === "MACHO" || k === "HEMBRA" ? k : null;
}
function mapEsterilizado(v: unknown): boolean | null {
  const k = normNombre(v);
  if (k === "SI") return true;
  if (k === "NO") return false;
  return null;
}

// Localiza la fila de encabezados buscando "Nombre Cliente" (la fila vacía inicial
// y los offsets difieren entre librerías, así que no la fijamos por índice).
function encontrarHeaderPadron(rows: unknown[][]): number {
  for (let i = 0; i < rows.length; i++) {
    const fila = rows[i] ?? [];
    if (fila.some((c) => normNombre(c) === "NOMBRE CLIENTE")) return i;
  }
  return -1;
}

function parsearPadron(wb: XLSX.WorkBook): { clientes: ClienteRow[]; perros: PerroRow[] } {
  const ws = buscarHoja(wb, SHEET_PADRON);
  if (!ws) {
    throw new Error(
      `No se encontró la hoja "${SHEET_PADRON}". Hojas en el archivo: ${wb.SheetNames.join(", ")}.`,
    );
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: true,
  });

  const headerIdx = encontrarHeaderPadron(rows);
  if (headerIdx < 0) {
    throw new Error(`No se encontró la columna "Nombre Cliente" en la hoja "${SHEET_PADRON}".`);
  }
  // Columnas: 0=# 1=Cliente 2=Teléfono 3=Perro 4=Raza 5=Veterinario 6=Sexo
  //           7=Tamaño 8=Esterilizado 9=Comportamiento 10=Observaciones
  const clientes: ClienteRow[] = [];
  const perros: PerroRow[] = [];
  const clienteIdPorNombreNorm = new Map<string, string>();
  let clienteActualId: string | null = null;

  for (const r of rows.slice(headerIdx + 1)) {
    if (!r) continue;
    const nombrePerro = r[3];
    if (nombrePerro == null || String(nombrePerro).trim() === "") continue;

    const nombreCli = r[1];
    if (nombreCli != null && String(nombreCli).trim() !== "") {
      const norm = normNombre(nombreCli);
      let id = clienteIdPorNombreNorm.get(norm);
      if (!id) {
        id = uuid();
        clienteIdPorNombreNorm.set(norm, id);
        clientes.push({
          id,
          nombre: String(nombreCli).trim(),
          telefono: limpiarTelefono(r[2]),
          email: null,
          notas: "Importado del padrón (BASE DE DATOS CLIENTES)",
        });
      }
      clienteActualId = id;
    }
    // Carry-forward: fila sin cliente → pertenece al cliente de la fila anterior.
    if (!clienteActualId) continue;

    perros.push({
      id: uuid(),
      cliente_id: clienteActualId,
      nombre: String(nombrePerro).trim(),
      raza: r[4] ? String(r[4]).trim() : null,
      sexo: mapSexo(r[6]),
      comportamiento: r[9] ? String(r[9]).trim() : null,
      veterinario: r[5] ? String(r[5]).trim() : null,
      esterilizado: mapEsterilizado(r[8]),
      talla: mapTalla(r[7]),
      notas: r[10] ? String(r[10]).trim() : "Importado del padrón",
    });
  }

  return { clientes, perros };
}

// Índice nombre_normalizado → perro_id (solo nombres únicos) para enlazar pagos.
function construirIndiceMatch(perros: PerroRow[]): Map<string, string> {
  const conteo = new Map<string, number>();
  const idPorNombre = new Map<string, string>();
  for (const p of perros) {
    const n = normNombre(p.nombre);
    conteo.set(n, (conteo.get(n) ?? 0) + 1);
    idPorNombre.set(n, p.id);
  }
  const indice = new Map<string, string>();
  for (const [n, id] of idPorNombre) {
    if (conteo.get(n) === 1) indice.set(n, id); // solo enlace inequívoco
  }
  return indice;
}

// Crea un perro/cliente placeholder vacío (atributos null) para pagos sin match.
function nuevoPerroPlaceholder(cliente_id: string, nombre: string): PerroRow {
  return {
    id: uuid(),
    cliente_id,
    nombre,
    raza: null,
    sexo: null,
    comportamiento: null,
    veterinario: null,
    esterilizado: null,
    talla: null,
    notas: MARCA_REVISAR_PERRO,
  };
}

export function construirMigracion(buffer: ArrayBuffer): MigracionData {
  const wb = XLSX.read(new Uint8Array(buffer), { type: "array" });
  const ws = buscarHoja(wb, SHEET_NAME);
  if (!ws) {
    throw new Error(
      `No se encontró la hoja "${SHEET_NAME}". Hojas en el archivo: ${wb.SheetNames.join(", ")}.`,
    );
  }

  // header:1 → filas como arreglos; blankrows:true conserva la posición real de cada
  // fila (clave para que el slice(8) = fila 9 coincida con el Excel).
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: true,
  });

  type PagoRaw = { fecha: string; descripcion: string; monto: number; servicio: string };
  const pagosRaw: PagoRaw[] = [];
  const egresos: EgresoRow[] = [];

  for (const row of rows.slice(8)) {
    if (!row || row.length < 6) continue;

    // --- INGRESO (A,D,E,F) ---
    const fIn = excelToYMD(row[0]);
    const descIn = row[3];
    const montoIn = row[4];
    const servIn = row[5];
    if (fIn && descIn && typeof montoIn === "number" && montoIn > 0) {
      pagosRaw.push({
        fecha: fIn,
        descripcion: String(descIn).trim(),
        monto: round2(montoIn),
        servicio: normServicio(servIn),
      });
    }

    // --- EGRESO (I,K,L,M,N) ---
    if (row.length >= 14) {
      const fEg = excelToYMD(row[8]);
      const descEg = row[10];
      const montoEg = row[11];
      const catEg = row[12];
      const tipoEg = row[13];
      if (fEg && descEg && typeof montoEg === "number" && montoEg > 0) {
        egresos.push({
          id: uuid(),
          fecha: fEg,
          descripcion: String(descEg).trim(),
          monto: round2(montoEg),
          categoria: catEg ? String(catEg).trim() : "Sin categoría",
          tipo_costo: normTipoCosto(tipoEg),
          notas: null,
        });
      }
    }
  }

  // Padrón real (clientes/perros limpios) + índice para enlazar pagos por nombre.
  const { clientes: clientesReales, perros: perrosReales } = parsearPadron(wb);
  const indiceMatch = construirIndiceMatch(perrosReales);
  const idsReales = new Set(perrosReales.map((p) => p.id));

  // Placeholders para pagos cuyo perro no se resuelve de forma inequívoca.
  const placeholderPorNombre = new Map<string, string>(); // norm → perro_id placeholder
  const clientesPlaceholder: ClienteRow[] = [];
  const perrosPlaceholder: PerroRow[] = [];

  // Devuelve el perro_id (real si hay match único; placeholder en caso contrario).
  function resolverPerroId(nombreLimpio: string): string {
    const n = normNombre(nombreLimpio);
    const real = indiceMatch.get(n);
    if (real) return real;
    let ph = placeholderPorNombre.get(n);
    if (!ph) {
      const clienteId = uuid();
      clientesPlaceholder.push({
        id: clienteId,
        nombre: `Cliente — ${nombreLimpio}`,
        telefono: null,
        email: null,
        notas: MARCA_REVISAR_CLIENTE,
      });
      const perro = nuevoPerroPlaceholder(clienteId, nombreLimpio);
      perrosPlaceholder.push(perro);
      ph = perro.id;
      placeholderPorNombre.set(n, ph);
    }
    return ph;
  }

  // Reservaciones agrupadas por (perro, servicio, año-mes) + pagos finales.
  const resvMap = new Map<string, ReservacionRow & { _total: number }>();
  const pagos: PagoRow[] = [];
  for (const p of pagosRaw) {
    const nombre = limpiarNombrePerro(p.descripcion);
    if (!nombre) continue;
    const perroId = resolverPerroId(nombre);
    const anio = p.fecha.slice(0, 4);
    const mes = p.fecha.slice(5, 7);
    const key = `${perroId}|${p.servicio}|${anio}|${mes}`;

    let res = resvMap.get(key);
    if (!res) {
      res = {
        id: uuid(),
        perro_id: perroId,
        servicio: p.servicio,
        fecha_inicio: p.fecha,
        fecha_fin: p.fecha,
        precio_acordado: 0,
        anticipo_acordado: 0,
        estado: "FINALIZADA",
        notas: "Reservación migrada del Excel",
        _total: 0,
      };
      resvMap.set(key, res);
    }
    if (p.fecha < res.fecha_inicio) res.fecha_inicio = p.fecha;
    if (p.fecha > res.fecha_fin) res.fecha_fin = p.fecha;
    res._total += p.monto;

    pagos.push({
      id: uuid(),
      reservacion_id: res.id,
      monto: p.monto,
      tipo: clasificarPagoTipo(p.descripcion),
      fecha: p.fecha,
      metodo_pago: null,
      descripcion: p.descripcion,
    });
  }

  // Padrón real primero, placeholders después.
  const clientes: ClienteRow[] = [...clientesReales, ...clientesPlaceholder];
  const perros: PerroRow[] = [...perrosReales, ...perrosPlaceholder];

  const reservaciones: ReservacionRow[] = [...resvMap.values()].map((r) => ({
    id: r.id,
    perro_id: r.perro_id,
    servicio: r.servicio,
    fecha_inicio: r.fecha_inicio,
    fecha_fin: r.fecha_fin,
    precio_acordado: round2(r._total),
    anticipo_acordado: 0,
    estado: r.estado,
    notas: r.notas,
  }));

  const reservacionesEnlazadas = reservaciones.filter((r) => idsReales.has(r.perro_id)).length;
  const totalIngresos = round2(pagos.reduce((s, p) => s + p.monto, 0));
  const totalEgresos = round2(egresos.reduce((s, e) => s + e.monto, 0));

  return {
    clientes,
    perros,
    reservaciones,
    pagos,
    egresos,
    resumen: {
      clientes: clientes.length,
      perros: perros.length,
      perrosReales: perrosReales.length,
      perrosPlaceholder: perrosPlaceholder.length,
      reservaciones: reservaciones.length,
      reservacionesEnlazadas,
      reservacionesSinEnlace: reservaciones.length - reservacionesEnlazadas,
      pagos: pagos.length,
      egresos: egresos.length,
      totalIngresos,
      totalEgresos,
    },
  };
}
