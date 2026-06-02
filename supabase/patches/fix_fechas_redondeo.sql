-- ============================================================================
-- Fix: fechas corridas por el bug Math.round en el importador (lib/migracion.ts)
-- ----------------------------------------------------------------------------
-- El importador usaba Math.round() sobre el serial de Excel, así que toda fila
-- capturada después del mediodía se empujaba al día siguiente. En el último día
-- del mes eso cruzaba la fila al mes siguiente, sacándola de los totales del mes.
--
-- 13 filas cruzaron de mes:
--   * 3 egresos : 28/02 -> 01/03  (NANCY, COMISION JL, JAVIER = $17,157.50)
--   * 10 pagos  : 31/03 -> 01/04  y  30/04 -> 01/05
--
-- anio/mes_num son columnas GENERADAS desde fecha, así que corregir `fecha`
-- recalcula automáticamente las vistas (vw_egresos_mensuales, etc.).
--
-- Cada UPDATE matchea por (fecha equivocada + descripcion + monto), combinación
-- única en los datos importados -> toca exactamente 1 fila. Es idempotente:
-- una vez corregida la fecha, el WHERE ya no vuelve a coincidir.
--
-- Ejecutar UNA vez en el SQL Editor de Supabase.
-- ============================================================================

begin;

-- ---- EGRESOS: 28/02 mal asignados a 01/03 -----------------------------------
update egresos set fecha = '2026-02-28'
  where fecha = '2026-03-01' and descripcion = 'NANCY'       and monto = 2000;
update egresos set fecha = '2026-02-28'
  where fecha = '2026-03-01' and descripcion = 'COMISION JL' and monto = 157.50;
update egresos set fecha = '2026-02-28'
  where fecha = '2026-03-01' and descripcion = 'JAVIER'      and monto = 15000;

-- ---- PAGOS: 31/03 mal asignados a 01/04 -------------------------------------
update pagos set fecha = '2026-03-31'
  where fecha = '2026-04-01' and descripcion = 'LUCA'                and monto = 1800;
update pagos set fecha = '2026-03-31'
  where fecha = '2026-04-01' and descripcion = 'ANTICIPO KOVA DELTA' and monto = 700;
update pagos set fecha = '2026-03-31'
  where fecha = '2026-04-01' and descripcion = 'FLOFY'               and monto = 700;
update pagos set fecha = '2026-03-31'
  where fecha = '2026-04-01' and descripcion = 'SISI'                and monto = 680;
update pagos set fecha = '2026-03-31'
  where fecha = '2026-04-01' and descripcion = 'MANOLITO'            and monto = 650;

-- ---- PAGOS: 30/04 mal asignados a 01/05 -------------------------------------
update pagos set fecha = '2026-04-30'
  where fecha = '2026-05-01' and descripcion = 'SISY'                    and monto = 665.33;
update pagos set fecha = '2026-04-30'
  where fecha = '2026-05-01' and descripcion = 'LUCAS'                   and monto = 350;
update pagos set fecha = '2026-04-30'
  where fecha = '2026-05-01' and descripcion = 'ANTICIPO SIRIUS'         and monto = 350;
update pagos set fecha = '2026-04-30'
  where fecha = '2026-05-01' and descripcion = 'ANTICIPO APOLO JUVENTINO' and monto = 700;
update pagos set fecha = '2026-04-30'
  where fecha = '2026-05-01' and descripcion = 'ARIA'                    and monto = 275;

-- ---- Verificación: febrero debe dar 59,378.54 -------------------------------
-- Revisa el resultado ANTES de hacer commit.
select 'egresos feb 2026' as q, sum(monto) as total
  from egresos where anio = 2026 and mes_num = 2;   -- esperado: 59378.54

commit;
