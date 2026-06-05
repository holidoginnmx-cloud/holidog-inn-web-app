-- ============================================================================
-- Holidog Inn — Foto de la cartilla de vacunación.
-- Ejecutar en el SQL Editor DESPUÉS de 0008.
--
-- Hasta ahora solo guardábamos `cartilla_vigente` (boolean) y `cartilla_vence`
-- (date). Agregamos la URL pública de una foto de la cartilla, que vive en el
-- mismo bucket público `fotos-perros` bajo el prefijo `cartillas/`.
-- ============================================================================

alter table perros
  add column if not exists cartilla_foto_url text;
