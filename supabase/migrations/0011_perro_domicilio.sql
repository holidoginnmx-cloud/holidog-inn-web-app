-- ============================================================================
-- Holidog Inn — Domicilio del perro (para recoger/dejar la mascota).
-- Ejecutar en el SQL Editor DESPUÉS de las migraciones 0009.
--
-- Campo opcional de texto libre. Solo aplica cuando el cliente pide que pasen
-- por su mascota; no afecta tallas, precios ni reglas de negocio.
-- ============================================================================

alter table perros
  add column if not exists domicilio text;
