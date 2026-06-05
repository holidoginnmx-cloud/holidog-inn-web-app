-- ============================================================================
-- Holidog Inn — Desparasitación del perro.
-- Ejecutar en el SQL Editor DESPUÉS de 0011.
--
-- Igual que la cartilla de vacunación, guardamos solo el estado vigente
-- (`desparasitacion_vigente`) y, opcionalmente, cuándo vence
-- (`desparasitacion_vence`).
-- ============================================================================

alter table perros
  add column if not exists desparasitacion_vigente boolean not null default false,
  add column if not exists desparasitacion_vence   date;
