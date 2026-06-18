-- ============================================================================
-- Holidog Inn 2026 — Esquema de base de datos
-- Stack: Supabase (PostgreSQL 15+)
-- ============================================================================
-- Ejecutar este archivo completo en el SQL Editor de Supabase
-- ============================================================================

-- Nota: gen_random_uuid() es nativa en PostgreSQL 13+ y Supabase ya viene
-- con pgcrypto habilitado. No requiere CREATE EXTENSION.

-- ============================================================================
-- ENUMS
-- ============================================================================

create type servicio_tipo as enum ('HOTEL', 'ESTETICA', 'GUARDERIA');
create type pago_tipo as enum ('ANTICIPO', 'ABONO', 'RESTANTE');
create type reservacion_estado as enum ('RESERVADA', 'EN_CURSO', 'FINALIZADA', 'CANCELADA');
create type tipo_costo as enum ('FIJO', 'VARIABLE', 'SUELDO', 'MARKETING', 'REINVERSION');
create type sexo_perro as enum ('MACHO', 'HEMBRA');
create type talla_perro as enum ('EXTRA_CHICO', 'CHICO', 'MEDIANO', 'GRANDE');

-- ============================================================================
-- TRIGGER GENÉRICO updated_at
-- ============================================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================================
-- TABLA: clientes
-- ============================================================================

create table clientes (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  telefono    text,
  email       text,
  notas       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_clientes_updated_at
  before update on clientes
  for each row execute function set_updated_at();

create index idx_clientes_nombre on clientes using gin (to_tsvector('spanish', nombre));

-- ============================================================================
-- TABLA: perros
-- ============================================================================

create table perros (
  id                uuid primary key default gen_random_uuid(),
  cliente_id        uuid not null references clientes(id) on delete cascade,
  nombre            text not null,
  raza              text,
  sexo              sexo_perro,
  fecha_nacimiento  date,
  peso_kg           numeric(5,2),
  -- Talla calculada automáticamente a partir del peso
  talla             talla_perro generated always as (
    case
      when peso_kg is null      then null
      when peso_kg < 6          then 'EXTRA_CHICO'::talla_perro
      when peso_kg < 16         then 'CHICO'::talla_perro
      when peso_kg <= 25        then 'MEDIANO'::talla_perro
      else                           'GRANDE'::talla_perro
    end
  ) stored,
  foto_url          text,
  alergias          text,
  comportamiento    text,
  notas             text,
  -- Domicilio para recoger/dejar la mascota (opcional; solo si el cliente lo pide)
  domicilio         text,
  -- Cartilla de vacunación (no trackeamos vacunas individuales, solo cartilla)
  cartilla_vigente  boolean not null default false,
  cartilla_vence    date,
  cartilla_foto_url text,
  -- Desparasitación (igual que la cartilla: solo estado vigente + vencimiento)
  desparasitacion_vigente boolean not null default false,
  desparasitacion_vence   date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger trg_perros_updated_at
  before update on perros
  for each row execute function set_updated_at();

create index idx_perros_cliente on perros(cliente_id);
create index idx_perros_nombre  on perros using gin (to_tsvector('spanish', nombre));

-- ============================================================================
-- TABLA: reservaciones
-- ============================================================================

create table reservaciones (
  id                  uuid primary key default gen_random_uuid(),
  perro_id            uuid not null references perros(id) on delete cascade,
  servicio            servicio_tipo not null,
  fecha_inicio        date not null,
  fecha_fin           date,
  -- Hora de check-in / check-out (opcional, ajustable durante la estancia).
  hora_check_in       time,
  hora_check_out      time,
  precio_acordado     numeric(10,2) not null default 0,
  anticipo_acordado   numeric(10,2) default 0,
  estado              reservacion_estado not null default 'RESERVADA',
  notas               text,
  -- Bandera para identificar registros migrados desde Excel histórico
  origen_legacy       boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (fecha_fin is null or fecha_fin >= fecha_inicio)
);

create trigger trg_reservaciones_updated_at
  before update on reservaciones
  for each row execute function set_updated_at();

create index idx_reservaciones_perro  on reservaciones(perro_id);
create index idx_reservaciones_fechas on reservaciones(fecha_inicio, fecha_fin);
create index idx_reservaciones_estado on reservaciones(estado);

-- ============================================================================
-- TABLA: pagos
-- ============================================================================

create table pagos (
  id              uuid primary key default gen_random_uuid(),
  reservacion_id  uuid references reservaciones(id) on delete cascade,
  monto           numeric(10,2) not null check (monto >= 0),
  tipo            pago_tipo not null default 'ABONO',
  fecha           date not null,
  metodo_pago     text,
  descripcion     text,
  -- Para reportes mensuales/semanales sin recalcular
  mes_num         smallint generated always as (extract(month from fecha)) stored,
  anio            smallint generated always as (extract(year from fecha)) stored,
  created_at      timestamptz not null default now()
);

create index idx_pagos_reservacion on pagos(reservacion_id);
create index idx_pagos_fecha       on pagos(fecha);
create index idx_pagos_anio_mes    on pagos(anio, mes_num);

-- ============================================================================
-- TABLA: egresos
-- ============================================================================

create table egresos (
  id           uuid primary key default gen_random_uuid(),
  fecha        date not null,
  descripcion  text not null,
  monto        numeric(10,2) not null check (monto >= 0),
  categoria    text not null,
  tipo_costo   tipo_costo not null,
  notas        text,
  mes_num      smallint generated always as (extract(month from fecha)) stored,
  anio         smallint generated always as (extract(year from fecha)) stored,
  created_at   timestamptz not null default now()
);

create index idx_egresos_fecha     on egresos(fecha);
create index idx_egresos_categoria on egresos(categoria);
create index idx_egresos_tipo      on egresos(tipo_costo);
create index idx_egresos_anio_mes  on egresos(anio, mes_num);

-- ============================================================================
-- TABLA: config (cupo y otros parámetros globales)
-- ============================================================================

create table config (
  id            int primary key default 1,
  cupo_maximo   int not null default 20,
  nombre_hotel  text not null default 'Holidog Inn',
  updated_at    timestamptz not null default now(),
  check (id = 1)
);

create trigger trg_config_updated_at
  before update on config
  for each row execute function set_updated_at();

insert into config (id) values (1) on conflict do nothing;

-- ============================================================================
-- TABLA: patrocinios (hoja "PATROCINIOS" del Excel)
-- Lista de patrocinadores; cada uno puede patrocinar el baño y/o el corral.
-- ============================================================================

create table patrocinios (
  id                uuid primary key default gen_random_uuid(),
  nombre            text not null,
  patrocina_bano    boolean not null default false,
  patrocina_corral  boolean not null default false,
  notas             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger trg_patrocinios_updated_at
  before update on patrocinios
  for each row execute function set_updated_at();

-- ============================================================================
-- TABLA: tarifas (precios sugeridos por servicio y peso)
-- Catálogo editable de precios. La app sugiere `precio_acordado` al crear una
-- reservación; los rangos de peso viven en el código (lib/tarifas.ts).
-- ============================================================================

create table tarifas (
  codigo      text primary key,
  servicio    servicio_tipo not null,
  etiqueta    text not null,
  precio      numeric(10,2) not null default 0,
  orden       int not null default 0,
  updated_at  timestamptz not null default now()
);

create trigger trg_tarifas_updated_at
  before update on tarifas
  for each row execute function set_updated_at();

insert into tarifas (codigo, servicio, etiqueta, precio, orden) values
  ('HOTEL_NORMAL',         'HOTEL',    'Hotel · Normal (1–19 kg)',          350, 1),
  ('HOTEL_XL',             'HOTEL',    'Hotel · XL (20+ kg)',               450, 2),
  ('HOTEL_PROBARF_NORMAL', 'HOTEL',    'Hotel ProBarf · Normal (1–19 kg)',  300, 3),
  ('HOTEL_PROBARF_XL',     'HOTEL',    'Hotel ProBarf · XL (20+ kg)',       400, 4),
  ('ESTETICA_XCHICO',      'ESTETICA', 'Estética · Extra chico (1–5 kg)',   300, 1),
  ('ESTETICA_CHICO',       'ESTETICA', 'Estética · Chico (6–15 kg)',        350, 2),
  ('ESTETICA_MEDIANO',     'ESTETICA', 'Estética · Mediano (16–25 kg)',     450, 3),
  ('ESTETICA_GRANDE',      'ESTETICA', 'Estética · Grande (25+ kg)',        600, 4)
on conflict do nothing;

-- ============================================================================
-- VISTAS para el dashboard
-- ============================================================================

-- Resumen mensual de ingresos
create or replace view vw_ingresos_mensuales as
select
  anio,
  mes_num,
  to_char(make_date(anio, mes_num, 1), 'TMMonth') as mes_nombre,
  sum(monto)::numeric(12,2) as total_ingresos,
  count(*)                  as cantidad_pagos
from pagos
group by anio, mes_num
order by anio, mes_num;

-- Resumen mensual de egresos
create or replace view vw_egresos_mensuales as
select
  anio,
  mes_num,
  to_char(make_date(anio, mes_num, 1), 'TMMonth') as mes_nombre,
  sum(monto)::numeric(12,2) as total_egresos,
  count(*)                  as cantidad_movimientos
from egresos
group by anio, mes_num
order by anio, mes_num;

-- Egresos por categoría (para el % sobre ingresos)
create or replace view vw_egresos_por_categoria as
select
  anio,
  mes_num,
  categoria,
  tipo_costo,
  sum(monto)::numeric(12,2) as total
from egresos
group by anio, mes_num, categoria, tipo_costo
order by anio, mes_num, total desc;

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

-- Ocupación actual del hotel
create or replace view vw_ocupacion_hoy as
select
  r.id,
  p.nombre as perro,
  c.nombre as cliente,
  r.fecha_inicio,
  r.fecha_fin,
  r.servicio,
  r.estado
from reservaciones r
join perros p   on p.id = r.perro_id
join clientes c on c.id = p.cliente_id
where r.estado in ('RESERVADA', 'EN_CURSO')
  and r.servicio = 'HOTEL'
  and current_date between r.fecha_inicio and coalesce(r.fecha_fin, current_date);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
-- App single-user. El acceso lo gestiona Clerk en el servidor con la service
-- role key. RLS habilitado por hábito pero permitiendo todo a usuarios
-- autenticados; si más adelante hay multi-usuario, ajustar policies aquí.

alter table clientes       enable row level security;
alter table perros         enable row level security;
alter table reservaciones  enable row level security;
alter table pagos          enable row level security;
alter table egresos        enable row level security;
alter table config         enable row level security;
alter table patrocinios    enable row level security;
alter table tarifas        enable row level security;

-- Policy permisiva para authenticated; el control fino lo hace Clerk en el server
create policy "allow_all_authenticated" on clientes      for all to authenticated using (true) with check (true);
create policy "allow_all_authenticated" on perros        for all to authenticated using (true) with check (true);
create policy "allow_all_authenticated" on reservaciones for all to authenticated using (true) with check (true);
create policy "allow_all_authenticated" on pagos         for all to authenticated using (true) with check (true);
create policy "allow_all_authenticated" on egresos       for all to authenticated using (true) with check (true);
create policy "allow_all_authenticated" on config        for all to authenticated using (true) with check (true);
create policy "allow_all_authenticated" on patrocinios   for all to authenticated using (true) with check (true);
create policy "allow_all_authenticated" on tarifas       for all to authenticated using (true) with check (true);
