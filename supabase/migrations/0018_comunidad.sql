-- =============================================================================
-- Línea Brava — 0018: Foro clásico → Comunidad (feed estilo X)
-- Reusa forum_threads/forum_replies como posts/respuestas del feed.
-- No se dropean title/category/image_url/closed: la app móvil aún los lee.
-- =============================================================================

-- 1) Posts sin título ni categoría obligatorios
alter table public.forum_threads alter column title drop not null;
alter table public.forum_threads alter column category drop not null;

-- 2) Multimedia: hasta 4 imágenes por post/respuesta
alter table public.forum_threads add column if not exists image_urls text[] not null default '{}';
alter table public.forum_replies add column if not exists image_urls text[] not null default '{}';

-- 3) Avatar del autor (denormalizado, igual que author_name)
alter table public.forum_threads add column if not exists author_avatar text;
alter table public.forum_replies add column if not exists author_avatar text;

-- 4) Data existente: el título pasa a ser la primera línea del post;
--    la imagen suelta pasa al arreglo.
update public.forum_threads
  set body = title || E'\n\n' || body, title = null
  where title is not null;
update public.forum_threads
  set image_urls = array[image_url]
  where image_url is not null and image_urls = '{}';
update public.forum_replies
  set image_urls = array[image_url]
  where image_url is not null and image_urls = '{}';

-- 5) Bucket para multimedia de comunidad (subida client-side desde el navegador)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community-media', 'community-media', true, 5242880,
        array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update
  set public = true, file_size_limit = 5242880,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists community_media_read on storage.objects;
create policy community_media_read on storage.objects
  for select using (bucket_id = 'community-media');

drop policy if exists community_media_insert on storage.objects;
create policy community_media_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'community-media'
              and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists community_media_delete on storage.objects;
create policy community_media_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'community-media'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
