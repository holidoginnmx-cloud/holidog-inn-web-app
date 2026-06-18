// Normaliza un embed de Supabase a un único registro (o null).
//
// PostgREST devuelve las relaciones a-uno a veces como objeto y a veces como
// array de un elemento (según cómo infiera la cardinalidad del join). `one()`
// aplana ambos casos a `T | null` para que el resto del código no tenga que
// preocuparse por la forma. Antes estaba duplicada en cada archivo que leía
// embeds; vive aquí como fuente única.
export function one<T>(x: T | T[] | null | undefined): T | null {
  if (x == null) return null;
  return Array.isArray(x) ? (x[0] ?? null) : x;
}
