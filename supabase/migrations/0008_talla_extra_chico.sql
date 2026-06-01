-- ============================================================================
-- Holidog Inn — Nuevas tallas: EXTRA_CHICO, CHICO, MEDIANO, GRANDE.
-- Ejecutar en el SQL Editor DESPUÉS de 0007.
--
-- Antes: enum ('CHICO','MEDIANO','GRANDE','GIGANTE') con rangos <10/<25/<40/40+.
-- Ahora: enum ('EXTRA_CHICO','CHICO','MEDIANO','GRANDE') alineado con la estética:
--   1–5 → EXTRA_CHICO · 6–15 → CHICO · 16–25 → MEDIANO · 25+ → GRANDE
--
-- Postgres no permite quitar valores de un enum, así que recreamos el tipo.
-- Los perros GIGANTE existentes se remapean a GRANDE; el resto se recalcula del
-- peso al final (los rangos cambiaron). Reutiliza el trigger de 0004.
-- ============================================================================

-- 1) Renombrar el tipo viejo y crear el nuevo.
alter type talla_perro rename to talla_perro_old;
create type talla_perro as enum ('EXTRA_CHICO', 'CHICO', 'MEDIANO', 'GRANDE');

-- 2) Recrear el trigger de talla con los nuevos rangos y valores.
--    (El cuerpo casteaba a 'GIGANTE'::talla_perro, que ya no existe.)
create or replace function perros_set_talla()
returns trigger
language plpgsql
as $$
begin
  if new.peso_kg is not null then
    -- Peso manda: talla derivada del peso (alineada con la estética).
    new.talla := case
      when new.peso_kg < 6   then 'EXTRA_CHICO'::talla_perro
      when new.peso_kg < 16  then 'CHICO'::talla_perro
      when new.peso_kg <= 25 then 'MEDIANO'::talla_perro
      else                        'GRANDE'::talla_perro
    end;
  end if;
  -- Si peso_kg is null: se respeta new.talla tal cual (manual o null).
  return new;
end;
$$;

-- 3) Convertir la columna al tipo nuevo, remapeando GIGANTE → GRANDE.
alter table perros
  alter column talla type talla_perro
  using (
    case talla::text
      when 'GIGANTE' then 'GRANDE'
      else talla::text
    end::talla_perro
  );

-- 4) Eliminar el tipo viejo.
drop type talla_perro_old;

-- 5) Backfill: recalcular del peso con los rangos nuevos (los GIGANTE ya pasaron
--    a GRANDE en el paso 3; aquí se reacomodan los demás, p. ej. 12 kg → CHICO).
update perros
   set talla = case
     when peso_kg < 6   then 'EXTRA_CHICO'::talla_perro
     when peso_kg < 16  then 'CHICO'::talla_perro
     when peso_kg <= 25 then 'MEDIANO'::talla_perro
     else                    'GRANDE'::talla_perro
   end
 where peso_kg is not null;
