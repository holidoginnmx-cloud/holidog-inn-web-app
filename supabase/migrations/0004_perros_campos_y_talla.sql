-- ============================================================================
-- Holidog Inn — Padrón real de perros: columnas nuevas + talla editable a mano.
-- Ejecutar en el SQL Editor DESPUÉS de 0002 y ANTES de 0005.
--
-- 1) Agrega `veterinario` y `esterilizado` a `perros`.
-- 2) Rediseña `talla`: hoy es columna GENERATED STORED (no se puede ALTER ni
--    insertar a mano). La convertimos en columna normal + trigger que conserva
--    el comportamiento automático: si hay peso, el peso manda; si no hay peso,
--    se respeta la talla provista (edición manual / padrón del Excel).
-- ============================================================================

-- 1) Columnas nuevas
alter table perros add column if not exists veterinario  text;
alter table perros add column if not exists esterilizado boolean;

-- 2) Rediseño de talla: drop de la columna generada y alta como columna normal.
alter table perros drop column if exists talla;
alter table perros add  column talla talla_perro;

-- 3) Función + trigger que reproduce el cálculo por peso y permite edición manual.
create or replace function perros_set_talla()
returns trigger
language plpgsql
as $$
begin
  if new.peso_kg is not null then
    -- Peso manda: talla derivada del peso (idéntico a la antigua columna generada).
    new.talla := case
      when new.peso_kg < 10 then 'CHICO'::talla_perro
      when new.peso_kg < 25 then 'MEDIANO'::talla_perro
      when new.peso_kg < 40 then 'GRANDE'::talla_perro
      else                       'GIGANTE'::talla_perro
    end;
  end if;
  -- Si peso_kg is null: se respeta new.talla tal cual (manual o null).
  return new;
end;
$$;

drop trigger if exists trg_perros_talla on perros;
create trigger trg_perros_talla
  before insert or update on perros
  for each row execute function perros_set_talla();

-- 4) Backfill: recomputar talla de perros existentes con peso (el DROP la borró).
update perros
   set talla = case
     when peso_kg < 10 then 'CHICO'::talla_perro
     when peso_kg < 25 then 'MEDIANO'::talla_perro
     when peso_kg < 40 then 'GRANDE'::talla_perro
     else                   'GIGANTE'::talla_perro
   end
 where peso_kg is not null;
