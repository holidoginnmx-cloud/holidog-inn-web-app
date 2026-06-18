// Helpers de fecha en español-MX usando Intl (sin dependencias).
// Las fechas de la BD llegan como "YYYY-MM-DD" (date) o ISO (timestamptz).

const fmtFechaCorta = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function parse(value: string): Date | null {
  // Tomamos solo la parte de fecha "YYYY-MM-DD" (los timestamptz llegan como ISO;
  // aquí siempre nos interesa el día calendario, no la hora) y la anclamos a
  // medianoche local para evitar el corrimiento de un día por zona horaria
  // —p. ej. un birthDate guardado a medianoche UTC se vería un día antes en MX—.
  const soloFecha = value.slice(0, 10);
  const d = /^\d{4}-\d{2}-\d{2}$/.test(soloFecha)
    ? new Date(`${soloFecha}T00:00:00`)
    : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatFecha(value: string | null | undefined): string {
  if (!value) return "—";
  const d = parse(value);
  return d ? fmtFechaCorta.format(d) : "—";
}

// Edad legible a partir de la fecha de nacimiento ("3 años", "5 meses").
export function calcularEdad(fechaNacimiento: string | null | undefined): string | null {
  if (!fechaNacimiento) return null;
  const nac = parse(fechaNacimiento);
  if (!nac) return null;
  const hoy = new Date();
  let meses = (hoy.getFullYear() - nac.getFullYear()) * 12 + (hoy.getMonth() - nac.getMonth());
  if (hoy.getDate() < nac.getDate()) meses -= 1;
  if (meses < 0) return null;
  if (meses < 12) return `${meses} ${meses === 1 ? "mes" : "meses"}`;
  const anios = Math.floor(meses / 12);
  return `${anios} ${anios === 1 ? "año" : "años"}`;
}

// Fecha de hoy en formato "YYYY-MM-DD" (zona local, sin corrimiento UTC).
export function hoyISO(): string {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

// Formatea un Date a "YYYY-MM-DD" en zona local (sin saltos por UTC).
function isoLocal(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// "YYYY-MM-DD" + n días.
export function addDiasISO(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return isoLocal(d);
}

// Día del mes (1-31) de una fecha ISO.
export function diaDelMes(iso: string): number {
  return Number(iso.slice(8, 10));
}

// Noches entre dos fechas "YYYY-MM-DD" (entrada/salida del hotel). Es la
// diferencia en días; si el rango es inválido o de 0 días, devuelve 0.
export function nochesEntre(inicioISO: string, finISO: string): number {
  const a = parse(inicioISO);
  const b = parse(finISO);
  if (!a || !b) return 0;
  const dias = Math.round((b.getTime() - a.getTime()) / 86_400_000);
  return dias > 0 ? dias : 0;
}

const fmtDiaSemana = new Intl.DateTimeFormat("es-MX", { weekday: "short" });
const fmtDiaSemanaLargo = new Intl.DateTimeFormat("es-MX", { weekday: "long" });
const fmtMesAnio = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" });

// "lun", "mar", … (sin punto).
export function diaSemanaCorto(iso: string): string {
  return fmtDiaSemana.format(new Date(`${iso}T00:00:00`)).replace(".", "");
}

// "lunes", "martes", …
export function diaSemanaLargo(iso: string): string {
  return fmtDiaSemanaLargo.format(new Date(`${iso}T00:00:00`));
}

// "mayo de 2026".
export function etiquetaMesAnio(anio: number, mes: number): string {
  return fmtMesAnio.format(new Date(anio, mes - 1, 1));
}

const fmtMesCorto = new Intl.DateTimeFormat("es-MX", { month: "short" });

// "may", "jun"… (para ejes de gráficas).
export function nombreMesCorto(anio: number, mes: number): string {
  return fmtMesCorto.format(new Date(anio, mes - 1, 1)).replace(".", "");
}

export type MesAnio = { anio: number; mes: number };

export function mesAnterior({ anio, mes }: MesAnio): MesAnio {
  return mes === 1 ? { anio: anio - 1, mes: 12 } : { anio, mes: mes - 1 };
}

export function mesSiguiente({ anio, mes }: MesAnio): MesAnio {
  return mes === 12 ? { anio: anio + 1, mes: 1 } : { anio, mes: mes + 1 };
}

// Los últimos N meses terminando en {anio, mes} (orden cronológico ascendente).
export function ultimosNMeses(fin: MesAnio, n: number): MesAnio[] {
  const out: MesAnio[] = [];
  let cur = fin;
  for (let i = 0; i < n; i++) {
    out.unshift(cur);
    cur = mesAnterior(cur);
  }
  return out;
}

export function mesActual(): MesAnio {
  const d = new Date();
  return { anio: d.getFullYear(), mes: d.getMonth() + 1 };
}

// Día (1-31) del primer lunes del mes. Si el día 1 es lunes, devuelve 1.
function primerLunesDelMes(anio: number, mesIndex: number): number {
  const dow1 = new Date(anio, mesIndex, 1).getDay(); // 0=Dom … 6=Sáb
  return 1 + ((1 - dow1 + 7) % 7);
}

// Semana del mes para una fecha "YYYY-MM-DD". Las semanas van de lunes a
// domingo; la semana 1 son los días antes del primer lunes (ej. mayo 2026:
// sem 1 = 1-3, sem 2 = 4-10, …). Devuelve 1..6.
export function semanaDelMes(iso: string): number {
  const d = new Date(`${iso}T00:00:00`);
  const day = d.getDate();
  const primerLunes = primerLunesDelMes(d.getFullYear(), d.getMonth());
  if (day < primerLunes) return 1;
  return Math.floor((day - primerLunes) / 7) + (primerLunes > 1 ? 2 : 1);
}

// Rangos de cada semana del mes (para la leyenda de colores).
export function semanasDelMes(
  anio: number,
  mes: number,
): { semana: number; inicio: number; fin: number }[] {
  const mesIndex = mes - 1;
  const dias = new Date(anio, mes, 0).getDate(); // último día del mes
  const primerLunes = primerLunesDelMes(anio, mesIndex);

  const lunes: number[] = [];
  if (primerLunes > 1) lunes.push(1); // semana 1 parcial
  for (let d = primerLunes; d <= dias; d += 7) lunes.push(d);

  return lunes.map((inicio, i) => ({
    semana: i + 1,
    inicio,
    fin: i + 1 < lunes.length ? lunes[i + 1]! - 1 : dias,
  }));
}
