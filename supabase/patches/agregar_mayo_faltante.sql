-- ============================================================================
-- Agregar los 13 ingresos de mayo 2026 que faltan (no estaban en el Excel)
-- Total a sumar: $6,766.28  (mayo pasaría de $60,997.68 a $67,763.96)
-- ----------------------------------------------------------------------------
-- Cómo funciona:
--   * Por cada fila busca el perro por nombre (col `busca`).
--   * Si encuentra EXACTAMENTE 1 perro: reutiliza (o crea) una reservación NO
--     legacy de mayo para ese perro+servicio e inserta el pago.
--   * Si encuentra 0 ó >1: NO inserta y lo reporta con RAISE NOTICE para que
--     lo resuelvas a mano (ver plantilla al final).
--   * Los pagos/reservaciones nuevos quedan con origen_legacy = false, así un
--     reimport del Excel NO los borra.
--
-- Todo va en una transacción: corre, lee los NOTICE y el SELECT final;
-- si algo no cuadra, ejecuta ROLLBACK; si todo bien, COMMIT.
-- ============================================================================

begin;

do $$
declare
  r       record;
  v_perro uuid;
  v_n     int;
  v_resv  uuid;
begin
  for r in
    select * from (values
      ('2026-05-28'::date, 'HOTEL'::servicio_tipo,    'ANTICIPO'::pago_tipo,  350.00, 'ANTICIPO NALA', 'NALA'),
      ('2026-05-28'::date, 'HOTEL'::servicio_tipo,    'ANTICIPO'::pago_tipo,  350.00, 'ANTICIPO KING', 'KING'),
      ('2026-05-28'::date, 'ESTETICA'::servicio_tipo, 'ABONO'::pago_tipo,     580.00, 'TOBY',          'TOBY'),
      ('2026-05-28'::date, 'HOTEL'::servicio_tipo,    'ABONO'::pago_tipo,     320.00, 'ARIA',          'ARIA'),
      ('2026-05-28'::date, 'ESTETICA'::servicio_tipo, 'ABONO'::pago_tipo,     500.00, 'POLLY',         'POLLY'),
      ('2026-05-29'::date, 'HOTEL'::servicio_tipo,    'ANTICIPO'::pago_tipo,  350.00, 'ANTICIPO NALA', 'NALA'),
      ('2026-05-29'::date, 'ESTETICA'::servicio_tipo, 'ABONO'::pago_tipo,     778.93, 'GORDA',         'GORDA'),
      ('2026-05-29'::date, 'HOTEL'::servicio_tipo,    'ABONO'::pago_tipo,    1027.35, 'NALA',          'NALA'),
      ('2026-05-30'::date, 'ESTETICA'::servicio_tipo, 'ABONO'::pago_tipo,     770.00, 'TOFFE',         'TOFFE'),
      ('2026-05-30'::date, 'HOTEL'::servicio_tipo,    'ABONO'::pago_tipo,     350.00, 'NALA REYNOSO',  'NALA REYNOSO'),
      ('2026-05-31'::date, 'ESTETICA'::servicio_tipo, 'ABONO'::pago_tipo,     720.00, 'ARIA',          'ARIA'),
      ('2026-05-31'::date, 'HOTEL'::servicio_tipo,    'ABONO'::pago_tipo,     320.00, 'ARIA',          'ARIA'),
      ('2026-05-31'::date, 'HOTEL'::servicio_tipo,    'ABONO'::pago_tipo,     350.00, 'DORA GRAJEDA',  'DORA GRAJEDA')
    ) as t(fecha, servicio, tipo, monto, descripcion, busca)
  loop
    select count(*) into v_n
      from perros where upper(btrim(nombre)) = upper(btrim(r.busca));

    if v_n <> 1 then
      raise notice 'REVISAR (% coincidencias) -> NO insertado: % | % | $% | perro buscado "%"',
        v_n, r.fecha, r.descripcion, r.monto, r.busca;
      continue;
    end if;

    select id into v_perro
      from perros where upper(btrim(nombre)) = upper(btrim(r.busca));

    -- Reutiliza una reservación NO legacy de mayo para ese perro+servicio; si no
    -- hay, crea una. (No tocamos las reservaciones legacy para no exponerlas a
    -- un borrado en cascada si algún día se reimporta.)
    select id into v_resv
      from reservaciones
      where perro_id = v_perro
        and servicio = r.servicio
        and origen_legacy = false
        and fecha_inicio between '2026-05-01' and '2026-05-31'
      order by fecha_inicio
      limit 1;

    if v_resv is null then
      insert into reservaciones
        (perro_id, servicio, fecha_inicio, estado, precio_acordado, origen_legacy, notas)
      values
        (v_perro, r.servicio, r.fecha, 'FINALIZADA', 0, false,
         'Captura manual: cierre de mayo 2026')
      returning id into v_resv;
    end if;

    insert into pagos (reservacion_id, monto, tipo, fecha, descripcion)
    values (v_resv, r.monto, r.tipo, r.fecha, r.descripcion);

    raise notice 'OK -> % | % | $%', r.fecha, r.descripcion, r.monto;
  end loop;
end $$;

-- Verificación: total de ingresos de mayo tras la inserción.
--   * Si TODO resolvió: 94 pagos / $67,763.96
--   * Si quedaron filas en REVISAR: el total será menor; resuélvelas con la
--     plantilla de abajo antes de COMMIT (o haz ROLLBACK y reintenta).
select 'ingresos mayo 2026' as q,
       count(*)  as num_pagos,
       sum(monto) as total
  from pagos
 where anio = 2026 and mes_num = 5;

commit;

-- ============================================================================
-- PLANTILLA para las filas que quedaron en "REVISAR" (NALA / NALA REYNOSO /
-- DORA GRAJEDA u otras). Primero averigua el perro correcto:
--
--   select id, nombre, cliente_id from perros where upper(nombre) like '%NALA%';
--   select id, nombre from clientes where upper(nombre) like '%GRAJEDA%';
--
-- Si el perro NO existe, créalo (con su cliente) y luego inserta el pago:
--
--   -- 1) cliente (si hace falta)
--   insert into clientes (nombre) values ('Dora Grajeda') returning id;   -- copia el id
--   -- 2) perro (si hace falta)
--   insert into perros (cliente_id, nombre) values ('<cliente_id>', '<nombre perro>') returning id;
--   -- 3) reservación de mayo
--   insert into reservaciones (perro_id, servicio, fecha_inicio, estado, precio_acordado, origen_legacy)
--     values ('<perro_id>', 'HOTEL', '2026-05-31', 'FINALIZADA', 0, false) returning id;
--   -- 4) pago
--   insert into pagos (reservacion_id, monto, tipo, fecha, descripcion)
--     values ('<reservacion_id>', 350.00, 'ABONO', '2026-05-31', 'DORA GRAJEDA');
-- ============================================================================
