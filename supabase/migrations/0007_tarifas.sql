-- ============================================================================
-- Holidog Inn — Tabla de tarifas (precios sugeridos por servicio y peso)
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de schema.sql.
--
-- Catálogo editable de precios. La app sugiere `precio_acordado` al crear una
-- reservación a partir de estas tarifas; el campo sigue siendo libre y editable.
-- Los rangos de peso viven en el código (lib/tarifas.ts); aquí solo los precios.
-- Reutiliza la función set_updated_at() ya definida en schema.sql.
-- ============================================================================

create table if not exists tarifas (
  codigo      text primary key,
  servicio    servicio_tipo not null,
  etiqueta    text not null,
  precio      numeric(10,2) not null default 0,
  orden       int not null default 0,
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_tarifas_updated_at on tarifas;
create trigger trg_tarifas_updated_at
  before update on tarifas
  for each row execute function set_updated_at();

alter table tarifas enable row level security;

drop policy if exists "allow_all_authenticated" on tarifas;
create policy "allow_all_authenticated" on tarifas
  for all to authenticated using (true) with check (true);

-- Datos iniciales. Idempotente: solo si la tabla está vacía.
-- HOTEL es por noche; ESTETICA es un cargo único. GUARDERIA no se autocalcula.
insert into tarifas (codigo, servicio, etiqueta, precio, orden)
select * from (values
  ('HOTEL_NORMAL',         'HOTEL'::servicio_tipo,    'Hotel · Normal (1–19 kg)',          350, 1),
  ('HOTEL_XL',             'HOTEL'::servicio_tipo,    'Hotel · XL (20+ kg)',               450, 2),
  ('HOTEL_PROBARF_NORMAL', 'HOTEL'::servicio_tipo,    'Hotel ProBarf · Normal (1–19 kg)',  300, 3),
  ('HOTEL_PROBARF_XL',     'HOTEL'::servicio_tipo,    'Hotel ProBarf · XL (20+ kg)',       400, 4),
  ('ESTETICA_XCHICO',      'ESTETICA'::servicio_tipo, 'Estética · Extra chico (1–5 kg)',   300, 1),
  ('ESTETICA_CHICO',       'ESTETICA'::servicio_tipo, 'Estética · Chico (6–15 kg)',        350, 2),
  ('ESTETICA_MEDIANO',     'ESTETICA'::servicio_tipo, 'Estética · Mediano (16–25 kg)',     450, 3),
  ('ESTETICA_GRANDE',      'ESTETICA'::servicio_tipo, 'Estética · Grande (25+ kg)',        600, 4)
) as seed(codigo, servicio, etiqueta, precio, orden)
where not exists (select 1 from tarifas);
