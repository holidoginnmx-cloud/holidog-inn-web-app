-- ============================================================================
-- Mayo 2026 — las 6 filas que quedaron en REVISAR (suma $3,007.35)
-- ----------------------------------------------------------------------------
-- Crea perros/clientes PLACEHOLDER marcados "por revisar" (misma convención que
-- la migración: notas = 'REVISAR: enlazar a perro real'), les cuelga una
-- reservación de mayo y los pagos. Así el total de mayo cuadra YA
-- (64,756.61 + 3,007.35 = 67,763.96) y luego, desde la app en /perros/revisar,
-- enlazas cada placeholder al perro real: la reservación (con sus pagos) se mueve
-- sola y el placeholder se borra.
--
-- Agrupación:
--   * NALA          -> 1 placeholder, 3 pagos HOTEL  (350 + 350 + 1027.35)
--   * TOBY          -> 1 placeholder, 1 pago ESTETICA (580)
--   * NALA REYNOSO  -> 1 placeholder, 1 pago HOTEL    (350)
--   * DORA GRAJEDA  -> 1 placeholder, 1 pago HOTEL    (350)
--
-- Todo origen_legacy = false (un reimport no lo borra). CORRER UNA SOLA VEZ.
-- Corre, revisa el SELECT final y haz COMMIT (incluido) o ROLLBACK.
-- ============================================================================

begin;

do $$
declare
  v_cli   uuid;
  v_perro uuid;
  v_resv  uuid;
begin
  -- ---- NALA (3 pagos, HOTEL) ------------------------------------------------
  insert into clientes (nombre, notas)
    values ('Cliente — NALA', 'REVISAR: enlazar a cliente real') returning id into v_cli;
  insert into perros (cliente_id, nombre, notas)
    values (v_cli, 'NALA', 'REVISAR: enlazar a perro real') returning id into v_perro;
  insert into reservaciones
    (perro_id, servicio, fecha_inicio, fecha_fin, estado, precio_acordado, origen_legacy, notas)
    values (v_perro, 'HOTEL', '2026-05-28', '2026-05-29', 'FINALIZADA', 0, false,
            'Captura manual cierre mayo 2026 (perro por revisar)')
    returning id into v_resv;
  insert into pagos (reservacion_id, monto, tipo, fecha, descripcion) values
    (v_resv,  350.00, 'ANTICIPO', '2026-05-28', 'ANTICIPO NALA'),
    (v_resv,  350.00, 'ANTICIPO', '2026-05-29', 'ANTICIPO NALA'),
    (v_resv, 1027.35, 'ABONO',    '2026-05-29', 'NALA');

  -- ---- TOBY (1 pago, ESTETICA) ---------------------------------------------
  insert into clientes (nombre, notas)
    values ('Cliente — TOBY', 'REVISAR: enlazar a cliente real') returning id into v_cli;
  insert into perros (cliente_id, nombre, notas)
    values (v_cli, 'TOBY', 'REVISAR: enlazar a perro real') returning id into v_perro;
  insert into reservaciones
    (perro_id, servicio, fecha_inicio, estado, precio_acordado, origen_legacy, notas)
    values (v_perro, 'ESTETICA', '2026-05-28', 'FINALIZADA', 0, false,
            'Captura manual cierre mayo 2026 (perro por revisar)')
    returning id into v_resv;
  insert into pagos (reservacion_id, monto, tipo, fecha, descripcion) values
    (v_resv, 580.00, 'ABONO', '2026-05-28', 'TOBY');

  -- ---- NALA REYNOSO (1 pago, HOTEL) ----------------------------------------
  insert into clientes (nombre, notas)
    values ('Cliente — NALA REYNOSO', 'REVISAR: enlazar a cliente real') returning id into v_cli;
  insert into perros (cliente_id, nombre, notas)
    values (v_cli, 'NALA REYNOSO', 'REVISAR: enlazar a perro real') returning id into v_perro;
  insert into reservaciones
    (perro_id, servicio, fecha_inicio, estado, precio_acordado, origen_legacy, notas)
    values (v_perro, 'HOTEL', '2026-05-30', 'FINALIZADA', 0, false,
            'Captura manual cierre mayo 2026 (perro por revisar)')
    returning id into v_resv;
  insert into pagos (reservacion_id, monto, tipo, fecha, descripcion) values
    (v_resv, 350.00, 'ABONO', '2026-05-30', 'NALA REYNOSO');

  -- ---- DORA GRAJEDA (1 pago, HOTEL) ----------------------------------------
  insert into clientes (nombre, notas)
    values ('Cliente — DORA GRAJEDA', 'REVISAR: enlazar a cliente real') returning id into v_cli;
  insert into perros (cliente_id, nombre, notas)
    values (v_cli, 'DORA GRAJEDA', 'REVISAR: enlazar a perro real') returning id into v_perro;
  insert into reservaciones
    (perro_id, servicio, fecha_inicio, estado, precio_acordado, origen_legacy, notas)
    values (v_perro, 'HOTEL', '2026-05-31', 'FINALIZADA', 0, false,
            'Captura manual cierre mayo 2026 (perro por revisar)')
    returning id into v_resv;
  insert into pagos (reservacion_id, monto, tipo, fecha, descripcion) values
    (v_resv, 350.00, 'ABONO', '2026-05-31', 'DORA GRAJEDA');
end $$;

-- Verificación: mayo debe quedar en 94 pagos / $67,763.96
select 'ingresos mayo 2026' as q,
       count(*)   as num_pagos,
       sum(monto) as total
  from pagos
 where anio = 2026 and mes_num = 5;

commit;
