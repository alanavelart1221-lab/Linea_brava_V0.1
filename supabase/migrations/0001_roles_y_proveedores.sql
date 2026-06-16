-- ============================================================================
-- Línea Brava — Roles (admin único) y solicitudes de proveedor
-- ============================================================================
-- CÓMO APLICARLO:
--   1. Abre Supabase → SQL Editor → New query.
--   2. Pega TODO este archivo y corre (Run).
--   3. Es idempotente: puedes correrlo de nuevo sin romper nada.
--
-- Qué hace:
--   • Crea los enums `rol` y `estado_proveedor`.
--   • Agrega `rol` y `estado_proveedor` a `profiles` y migra el `is_admin` actual.
--   • Deja como ADMIN ÚNICO al correo del dueño (abajo se puede cambiar).
--   • Crea la tabla `providers` (solicitudes de proveedor).
--   • Activa RLS: la seguridad real vive AQUÍ, no en el frontend.
-- ============================================================================

-- --- Correo del admin único -------------------------------------------------
-- Si algún día cambia, edítalo en los DOS lugares marcados con  <<ADMIN>>.

-- 1) Enums -------------------------------------------------------------------
do $$ begin
  create type rol as enum ('usuario', 'proveedor', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_proveedor as enum ('pendiente', 'aprobado');
exception when duplicate_object then null; end $$;

-- 2) Columnas en profiles ----------------------------------------------------
alter table public.profiles
  add column if not exists rol rol not null default 'usuario',
  add column if not exists estado_proveedor estado_proveedor;

-- Migra el booleano existente: quien era is_admin pasa a rol='admin'.
update public.profiles set rol = 'admin' where is_admin = true;

-- Admin único por correo  <<ADMIN>>
update public.profiles set rol = 'admin'
where id = (select id from auth.users where email = 'alanavelart1221@gmail.com');

-- 3) Helper: ¿el usuario actual es admin? ------------------------------------
-- SECURITY DEFINER para que no entre en recursión con las políticas RLS.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and rol = 'admin'
  );
$$;

-- 4) Protección de rol/estado en profiles ------------------------------------
-- Nadie puede auto-asignarse rol o estado_proveedor; solo un admin lo cambia.
-- Va por trigger para no tocar las políticas RLS que ya usa el login.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.rol is distinct from old.rol
      or new.estado_proveedor is distinct from old.estado_proveedor)
     and not public.is_admin() then
    raise exception 'No autorizado para cambiar rol o estado_proveedor';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_role on public.profiles;
create trigger trg_protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- 5) Tabla de proveedores (solicitudes) --------------------------------------
create table if not exists public.providers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  name        text not null,
  type        text not null check (type in ('taller','distribuidor','guia','eventos','equipo')),
  state       text not null,
  city        text not null,
  description text not null,
  specialty   text[] not null default '{}',
  phone       text not null,
  website     text,
  featured    boolean not null default false,
  status      estado_proveedor not null default 'pendiente',
  created_at  timestamptz not null default now(),
  approved_at timestamptz
);

create index if not exists providers_status_idx on public.providers (status);

-- 6) RLS: providers ----------------------------------------------------------
alter table public.providers enable row level security;

-- El público ve solo aprobados; el admin ve todo; el dueño ve su solicitud.
drop policy if exists providers_select on public.providers;
create policy providers_select on public.providers
  for select using (
    status = 'aprobado' or public.is_admin() or auth.uid() = user_id
  );

-- Un usuario autenticado crea SU propia solicitud, forzada a pendiente.
drop policy if exists providers_insert_own on public.providers;
create policy providers_insert_own on public.providers
  for insert with check (
    auth.uid() = user_id and status = 'pendiente' and featured = false
  );

-- Solo el admin aprueba / rechaza / destaca.
drop policy if exists providers_admin_update on public.providers;
create policy providers_admin_update on public.providers
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists providers_admin_delete on public.providers;
create policy providers_admin_delete on public.providers
  for delete using (public.is_admin());

-- 7) Tabla de tips -----------------------------------------------------------
-- Se crea si no existe (en tu base aún no estaba creada). Las columnas coinciden
-- con lo que usa la app (app/admin/tips y components/TipsGrid).
create table if not exists public.tips (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  category   text not null default 'General',
  body       text not null,
  image_url  text,
  video_url  text,
  created_at timestamptz not null default now()
);

create index if not exists tips_created_at_idx on public.tips (created_at desc);

-- 8) RLS: tips (solo admin escribe, todos leen) ------------------------------
alter table public.tips enable row level security;

drop policy if exists tips_public_read on public.tips;
create policy tips_public_read on public.tips
  for select using (true);

drop policy if exists tips_admin_insert on public.tips;
create policy tips_admin_insert on public.tips
  for insert with check (public.is_admin());

drop policy if exists tips_admin_update on public.tips;
create policy tips_admin_update on public.tips
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists tips_admin_delete on public.tips;
create policy tips_admin_delete on public.tips
  for delete using (public.is_admin());

-- El directorio arranca VACÍO: no se siembran proveedores de ejemplo.
-- Los proveedores reales entran por el flujo de solicitud (/proveedores/registro)
-- y los aprueba el admin desde /admin/proveedores.
