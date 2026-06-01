-- ============================================================================
-- Holidog Inn — Tabla de patrocinios (hoja "PATROCINIOS" del Excel)
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de schema.sql.
--
-- Lista de patrocinadores; cada uno puede patrocinar el baño y/o el corral.
-- Reutiliza la función set_updated_at() ya definida en schema.sql.
-- ============================================================================

create table if not exists patrocinios (
  id                uuid primary key default gen_random_uuid(),
  nombre            text not null,
  patrocina_bano    boolean not null default false,
  patrocina_corral  boolean not null default false,
  notas             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists trg_patrocinios_updated_at on patrocinios;
create trigger trg_patrocinios_updated_at
  before update on patrocinios
  for each row execute function set_updated_at();

alter table patrocinios enable row level security;

drop policy if exists "allow_all_authenticated" on patrocinios;
create policy "allow_all_authenticated" on patrocinios
  for all to authenticated using (true) with check (true);

-- Datos iniciales (los del Excel). Idempotente: solo si la tabla está vacía.
insert into patrocinios (nombre, patrocina_bano, patrocina_corral)
select * from (values
  ('XOCHIMILCO',          false, true),
  ('FORTA (EDUARDO PAZ)', true,  false),
  ('2M CENTRO',           true,  false),
  ('DESERT BATTLES',      true,  true),
  ('2M ALTOZANO',         true,  false)
) as seed(nombre, patrocina_bano, patrocina_corral)
where not exists (select 1 from patrocinios);
