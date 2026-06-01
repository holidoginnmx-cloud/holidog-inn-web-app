-- ============================================================================
-- Holidog Inn — Fix: agrega las columnas `origen_legacy` que faltaban.
--
-- Si la base se pobló por CSV (no por el wizard), 0002 nunca se corrió y estas
-- columnas no existen, así que aplicar_migracion_legacy falla con
-- "column origen_legacy does not exist". Esto las crea (idempotente) y marca
-- como legacy los registros ya importados, para que el re-import los reemplace.
--
-- NO redefine la función (esa la deja la 0005). Correr una sola vez en el SQL Editor.
-- ============================================================================

alter table clientes add column if not exists origen_legacy boolean not null default false;
alter table perros   add column if not exists origen_legacy boolean not null default false;
alter table pagos    add column if not exists origen_legacy boolean not null default false;
alter table egresos  add column if not exists origen_legacy boolean not null default false;

-- Marca lo ya importado (por CSV o import previo) como legacy reemplazable.
update clientes set origen_legacy = true
  where notas in ('Importado del Excel 2026, actualizar datos',
                  'Importado del padrón (BASE DE DATOS CLIENTES)',
                  'REVISAR: enlazar a cliente real');
update perros   set origen_legacy = true
  where notas in ('Importado del Excel 2026', 'Importado del padrón',
                  'REVISAR: enlazar a perro real');
update pagos    set origen_legacy = true
  where reservacion_id in (select id from reservaciones where origen_legacy = true);
update egresos  set origen_legacy = true;
