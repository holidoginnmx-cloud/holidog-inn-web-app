-- ============================================================================
-- Holidog Inn — Supabase Storage
-- Bucket público para fotos de perros. Ejecutar en el SQL Editor de Supabase
-- DESPUÉS de schema.sql.
-- ============================================================================

-- Bucket 'fotos-perros' con lectura pública.
insert into storage.buckets (id, name, public)
values ('fotos-perros', 'fotos-perros', true)
on conflict (id) do nothing;

-- Lectura pública de los objetos del bucket (las fotos se sirven por URL pública).
create policy "fotos_perros_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'fotos-perros');

-- La app sube las fotos desde Server Actions con la SERVICE_ROLE_KEY, que ignora
-- RLS. Estas policies permiten además escritura desde un usuario autenticado por
-- si en el futuro se sube desde el cliente.
create policy "fotos_perros_auth_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'fotos-perros');

create policy "fotos_perros_auth_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'fotos-perros');

create policy "fotos_perros_auth_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'fotos-perros');
