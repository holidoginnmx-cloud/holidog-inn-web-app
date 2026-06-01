-- ============================================================================
-- Holidog Inn — RPC de re-import v2.
-- Ejecutar en el SQL Editor DESPUÉS de 0004 (necesita perros.veterinario,
-- perros.esterilizado y la talla editable).
--
-- Mismo flujo transaccional que 0002 (borra todo origen_legacy=true e inserta
-- el lote), pero ahora el padrón real trae raza/sexo/comportamiento/veterinario/
-- esterilizado/talla, y los clientes traen teléfono.
-- peso_kg se deja null → el trigger perros_set_talla() respeta la talla provista.
-- ============================================================================

create or replace function aplicar_migracion_legacy(payload jsonb)
returns jsonb
language plpgsql
as $$
declare
  n_cli int; n_per int; n_res int; n_pag int; n_egr int;
begin
  -- 1) Borrar lo legacy previo (hijos antes que padres).
  delete from pagos          where origen_legacy = true;
  delete from reservaciones  where origen_legacy = true;
  delete from perros         where origen_legacy = true;
  delete from clientes       where origen_legacy = true;
  delete from egresos        where origen_legacy = true;

  -- 2) Insertar el lote nuevo (todo marcado origen_legacy = true).
  insert into clientes (id, nombre, telefono, email, notas, origen_legacy)
  select id, nombre, telefono, email, notas, true
  from jsonb_to_recordset(payload->'clientes')
    as x(id uuid, nombre text, telefono text, email text, notas text);
  get diagnostics n_cli = row_count;

  insert into perros
    (id, cliente_id, nombre, raza, sexo, comportamiento,
     veterinario, esterilizado, talla, notas, cartilla_vigente, origen_legacy)
  select id, cliente_id, nombre, raza, sexo::sexo_perro, comportamiento,
         veterinario, esterilizado, talla::talla_perro, notas, false, true
  from jsonb_to_recordset(payload->'perros')
    as x(id uuid, cliente_id uuid, nombre text, raza text, sexo text,
         comportamiento text, veterinario text, esterilizado boolean,
         talla text, notas text);
  get diagnostics n_per = row_count;

  insert into reservaciones
    (id, perro_id, servicio, fecha_inicio, fecha_fin, precio_acordado,
     anticipo_acordado, estado, notas, origen_legacy)
  select id, perro_id, servicio::servicio_tipo, fecha_inicio::date, fecha_fin::date,
         precio_acordado, anticipo_acordado, estado::reservacion_estado, notas, true
  from jsonb_to_recordset(payload->'reservaciones')
    as x(id uuid, perro_id uuid, servicio text, fecha_inicio text, fecha_fin text,
         precio_acordado numeric, anticipo_acordado numeric, estado text, notas text);
  get diagnostics n_res = row_count;

  insert into pagos (id, reservacion_id, monto, tipo, fecha, metodo_pago, descripcion, origen_legacy)
  select id, reservacion_id, monto, tipo::pago_tipo, fecha::date, metodo_pago, descripcion, true
  from jsonb_to_recordset(payload->'pagos')
    as x(id uuid, reservacion_id uuid, monto numeric, tipo text, fecha text,
         metodo_pago text, descripcion text);
  get diagnostics n_pag = row_count;

  insert into egresos (id, fecha, descripcion, monto, categoria, tipo_costo, notas, origen_legacy)
  select id, fecha::date, descripcion, monto, categoria, tipo_costo::tipo_costo, notas, true
  from jsonb_to_recordset(payload->'egresos')
    as x(id uuid, fecha text, descripcion text, monto numeric, categoria text,
         tipo_costo text, notas text);
  get diagnostics n_egr = row_count;

  return jsonb_build_object(
    'clientes', n_cli, 'perros', n_per, 'reservaciones', n_res,
    'pagos', n_pag, 'egresos', n_egr
  );
end;
$$;
