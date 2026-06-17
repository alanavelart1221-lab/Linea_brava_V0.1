-- ============================================================================
-- Línea Brava — Superadmin, tienda de proveedores y moderación de foro
-- ============================================================================
-- CÓMO APLICARLO (Supabase → SQL Editor):
--   El archivo está en DOS pasos por una limitación de Postgres: un valor nuevo
--   de enum no se puede USAR en la misma transacción en que se AGREGA.
--
--   1. Corre SOLO el «PASO 1» (agrega 'superadmin' al enum). Es una línea.
--   2. Luego corre el «PASO 2» (todo lo demás). Es idempotente: puedes
--      re-correrlo sin romper nada.
--
-- Qué hace:
--   • Agrega el rol 'superadmin' y deja tu correo como superadmin.
--   • is_admin() ahora cubre admin Y superadmin; agrega is_superadmin().
--   • Endurece el trigger: solo el superadmin nombra/quita admins.
--   • RPCs para el panel: admin_list_users() y set_admin().
--   • Tabla provider_products (tienda) + RLS + bucket 'provider-images'.
--   • Moderación de foro: columna closed + políticas admin (borrar / cerrar).
-- ============================================================================


-- ████████████████████████████████████████████████████████████████████████████
-- PASO 1 — Córrelo SOLO primero (y nada más).
-- ████████████████████████████████████████████████████████████████████████████

alter type rol add value if not exists 'superadmin';


-- ████████████████████████████████████████████████████████████████████████████
-- PASO 2 — Córrelo después del PASO 1. Idempotente.
-- ████████████████████████████████████████████████████████████████████████████

-- 1) Superadmin único por correo  <<SUPERADMIN>>
-- El trigger protect_profile_role (del 0001) bloquea cambios de rol cuando no hay
-- admin en sesión. En el SQL Editor no hay sesión, así que lo desactivamos solo
-- durante este seed y lo volvemos a activar enseguida.
alter table public.profiles disable trigger trg_protect_profile_role;

update public.profiles set rol = 'superadmin'
where id = (select id from auth.users where email = 'alanavelart1221@gmail.com');

alter table public.profiles enable trigger trg_protect_profile_role;

-- 2) Helpers de rol --------------------------------------------------------
-- is_admin() ahora incluye al superadmin, para que TODO el RLS admin existente
-- (providers, tips, etc.) también aplique al superadmin sin tocar esas políticas.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and rol in ('admin', 'superadmin')
  );
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and rol = 'superadmin'
  );
$$;

-- 3) Endurecer el trigger de protección de rol -----------------------------
-- estado_proveedor: lo cambia cualquier admin (aprobar proveedores).
-- rol: cualquier cambio que involucre 'admin' o 'superadmin' exige superadmin;
--      así un admin no puede auto-promoverse ni crear otros admins.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado_proveedor is distinct from old.estado_proveedor
     and not public.is_admin() then
    raise exception 'No autorizado para cambiar estado_proveedor';
  end if;

  if new.rol is distinct from old.rol then
    if old.rol in ('admin', 'superadmin') or new.rol in ('admin', 'superadmin') then
      if not public.is_superadmin() then
        raise exception 'Solo el superadmin puede asignar o quitar admin';
      end if;
    elsif not public.is_admin() then
      raise exception 'No autorizado para cambiar rol';
    end if;
  end if;

  return new;
end;
$$;
-- (el trigger trg_protect_profile_role del 0001 sigue apuntando a esta función)

-- 4) RPCs para el panel de superadmin --------------------------------------
-- Listar usuarios con su correo (de auth.users) y su rol. SECURITY DEFINER para
-- poder leer auth.users; valida is_superadmin() adentro.
create or replace function public.admin_list_users()
returns table (id uuid, email text, rol rol, estado_proveedor estado_proveedor)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Solo el superadmin puede listar usuarios';
  end if;
  return query
    select p.id, u.email::text, p.rol, p.estado_proveedor
    from public.profiles p
    join auth.users u on u.id = p.id
    order by
      case p.rol when 'superadmin' then 0 when 'admin' then 1 else 2 end,
      u.email;
end;
$$;

-- Hacer / quitar admin. Solo superadmin. Nunca toca a un superadmin.
create or replace function public.set_admin(target uuid, make_admin boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_rol rol;
begin
  if not public.is_superadmin() then
    raise exception 'Solo el superadmin puede cambiar administradores';
  end if;

  select rol into target_rol from public.profiles where id = target;
  if target_rol is null then
    raise exception 'Usuario no encontrado';
  end if;
  if target_rol = 'superadmin' then
    raise exception 'No se puede modificar al superadmin';
  end if;

  update public.profiles
    set rol = case when make_admin then 'admin'::rol else 'usuario'::rol end
    where id = target;
end;
$$;

-- Aprobar un proveedor: marca providers.status='aprobado' Y el perfil del
-- solicitante como estado_proveedor='aprobado'. SECURITY DEFINER porque un admin
-- normalmente no puede actualizar el profiles de OTRO usuario por RLS.
create or replace function public.approve_provider(p_provider_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
begin
  if not public.is_admin() then
    raise exception 'Solo un admin puede aprobar proveedores';
  end if;

  update public.providers
    set status = 'aprobado', approved_at = now()
    where id = p_provider_id
    returning user_id into v_user;

  if v_user is not null then
    update public.profiles set estado_proveedor = 'aprobado' where id = v_user;
  end if;
end;
$$;

grant execute on function public.is_superadmin() to authenticated;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.set_admin(uuid, boolean) to authenticated;
grant execute on function public.approve_provider(uuid) to authenticated;

-- 5) Tienda de proveedores --------------------------------------------------
create table if not exists public.provider_products (
  id          uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  name        text not null,
  description text,
  price       numeric(10,2),
  currency    text not null default 'MXN',
  image_url   text,
  created_at  timestamptz not null default now()
);

create index if not exists provider_products_provider_idx
  on public.provider_products (provider_id);

alter table public.provider_products enable row level security;

-- Lee el público si el proveedor padre está aprobado; el dueño ve los suyos; admin todo.
drop policy if exists provider_products_select on public.provider_products;
create policy provider_products_select on public.provider_products
  for select using (
    exists (
      select 1 from public.providers pr
      where pr.id = provider_id
        and (pr.status = 'aprobado' or pr.user_id = auth.uid())
    )
    or public.is_admin()
  );

-- El dueño del proveedor (o admin) administra sus productos.
drop policy if exists provider_products_insert on public.provider_products;
create policy provider_products_insert on public.provider_products
  for insert with check (
    exists (select 1 from public.providers pr where pr.id = provider_id and pr.user_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists provider_products_update on public.provider_products;
create policy provider_products_update on public.provider_products
  for update using (
    exists (select 1 from public.providers pr where pr.id = provider_id and pr.user_id = auth.uid())
    or public.is_admin()
  ) with check (
    exists (select 1 from public.providers pr where pr.id = provider_id and pr.user_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists provider_products_delete on public.provider_products;
create policy provider_products_delete on public.provider_products
  for delete using (
    exists (select 1 from public.providers pr where pr.id = provider_id and pr.user_id = auth.uid())
    or public.is_admin()
  );

-- 6) Bucket de imágenes de proveedor (logos y productos) -------------------
insert into storage.buckets (id, name, public)
values ('provider-images', 'provider-images', true)
on conflict (id) do nothing;

-- Lectura pública; subida/edición/borrado solo autenticados (el server action
-- ya valida que sea el dueño antes de subir).
drop policy if exists provider_images_read on storage.objects;
create policy provider_images_read on storage.objects
  for select using (bucket_id = 'provider-images');

drop policy if exists provider_images_insert on storage.objects;
create policy provider_images_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'provider-images');

drop policy if exists provider_images_update on storage.objects;
create policy provider_images_update on storage.objects
  for update to authenticated using (bucket_id = 'provider-images');

drop policy if exists provider_images_delete on storage.objects;
create policy provider_images_delete on storage.objects
  for delete to authenticated using (bucket_id = 'provider-images');

-- 7) Moderación de foro -----------------------------------------------------
-- NOTA: las tablas forum_* ya existen en la base (con su RLS de lectura/inserción).
-- Aquí SOLO agregamos: la columna `closed` y políticas de admin. No tocamos las
-- políticas base ni reactivamos RLS, para no alterar el acceso que ya funciona.
alter table public.forum_threads add column if not exists closed boolean not null default false;

drop policy if exists forum_threads_admin_delete on public.forum_threads;
create policy forum_threads_admin_delete on public.forum_threads
  for delete using (public.is_admin());

-- Permite al admin actualizar el hilo (cerrar / reabrir).
drop policy if exists forum_threads_admin_update on public.forum_threads;
create policy forum_threads_admin_update on public.forum_threads
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists forum_replies_admin_delete on public.forum_replies;
create policy forum_replies_admin_delete on public.forum_replies
  for delete using (public.is_admin());
