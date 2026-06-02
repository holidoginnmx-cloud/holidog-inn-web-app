-- ============================================================================
-- Mayo 2026 — egresos que faltan (no estaban en el Excel). Suma $6,500.00
-- Egresos de mayo pasaría de $45,677.50 a $52,177.50.
-- ----------------------------------------------------------------------------
-- Las 4 son del 31/05 (el Excel se cortó antes de fin de mes). origen_legacy =
-- false para que un reimport NO las borre. CORRER UNA SOLA VEZ.
-- ============================================================================

begin;

insert into egresos (fecha, descripcion, monto, categoria, tipo_costo, origen_legacy) values
  ('2026-05-31', 'GASOLINA',   2000.00, 'Transporte / Logística', 'VARIABLE',  false),
  ('2026-05-31', 'NANCY',      2000.00, 'RH / Asistente',         'SUELDO',    false),
  ('2026-05-31', 'COMISION N', 1500.00, 'Bano/ Estetica',         'VARIABLE',  false),
  ('2026-05-31', 'AARON',      1000.00, 'Marketing / Ads',        'MARKETING', false);

-- Verificación: egresos de mayo debe quedar en 37 filas / $52,177.50
select 'egresos mayo 2026' as q,
       count(*)   as num_egresos,
       sum(monto) as total
  from egresos
 where anio = 2026 and mes_num = 5;

commit;
