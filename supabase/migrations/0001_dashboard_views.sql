-- ============================================================================
-- Holidog Inn — Vistas para el dashboard
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de schema.sql.
--
-- schema.sql ya define: vw_ingresos_mensuales, vw_egresos_mensuales,
-- vw_egresos_por_categoria. Aquí agregamos las dos que faltan para el dashboard.
-- ============================================================================

-- Ingresos del mes desglosados por servicio (HOTEL / ESTETICA / GUARDERIA).
-- El servicio vive en la reservación; el pago aporta el monto y el mes/año.
create or replace view vw_ingresos_por_servicio as
select
  p.anio,
  p.mes_num,
  r.servicio,
  sum(p.monto)::numeric(12, 2) as total,
  count(*)                     as cantidad_pagos
from pagos p
join reservaciones r on r.id = p.reservacion_id
group by p.anio, p.mes_num, r.servicio;

-- Ingresos del mes por perro (para el Top 10 facturado).
create or replace view vw_ingresos_por_perro as
select
  p.anio,
  p.mes_num,
  pe.id     as perro_id,
  pe.nombre as perro_nombre,
  sum(p.monto)::numeric(12, 2) as total
from pagos p
join reservaciones r on r.id = p.reservacion_id
join perros pe       on pe.id = r.perro_id
group by p.anio, p.mes_num, pe.id, pe.nombre;
