-- ============================================================================
-- Holidog Inn — Hora de check-in y check-out en reservaciones.
-- Ejecutar en el SQL Editor DESPUÉS de 0008.
--
-- Las reservaciones ya guardan las fechas (fecha_inicio / fecha_fin); esto
-- añade la HORA de entrada y salida. Aplica a todos los servicios:
--   Hotel      → hora de entrada / salida
--   Guardería  → hora de llegada / recogida
--   Estética   → hora de dejar / recoger
-- Ambas son opcionales y se pueden ajustar durante toda la estancia.
-- ============================================================================

alter table reservaciones
  add column if not exists hora_check_in  time,
  add column if not exists hora_check_out time;
