-- ============================================================================
-- Línea Brava — Servicios del proveedor y solicitudes de cotización
-- ============================================================================
-- CÓMO APLICARLO (Supabase → SQL Editor → New query → Run):
--   Pega TODO este archivo y córrelo. Es idempotente.
--
-- Qué hace:
--   • Tabla provider_services (catálogo de servicios) + RLS (dueño/admin escribe,
--     público lee si el proveedor es visible).
--   • Tabla quote_requests (cotizaciones que piden los usuarios) + RLS. La
--     inserción solo se permite si el proveedor está en_prueba/activo: un
--     proveedor suspendido deja de recibir cotizaciones.
--   • Trigger que notifica al proveedor cuando llega una cotización nueva.
-- ============================================================================


-- 1) Servicios ---------------------------------------------------------------
create table if not exists public.provider_services (
  id          uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  name        text not null,
  description text,
  price       numeric(10,2),
  currency    text not null default 'MXN',
  created_at  timestamptz not null default now()
);

create index if not exists provider_services_provider_idx
  on public.provider_services (provider_id);

alter table public.provider_services enable row level security;

-- Lee el público si el proveedor padre es visible; el dueño ve los suyos; admin todo.
drop policy if exists provider_services_select on public.provider_services;
create policy provider_services_select on public.provider_services
  for select using (
    exists (
      select 1 from public.providers pr
      where pr.id = provider_id
        and (pr.estado in ('en_prueba', 'activo') or pr.user_id = auth.uid())
    )
    or public.is_admin()
  );

drop policy if exists provider_services_insert on public.provider_services;
create policy provider_services_insert on public.provider_services
  for insert with check (
    exists (select 1 from public.providers pr where pr.id = provider_id and pr.user_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists provider_services_update on public.provider_services;
create policy provider_services_update on public.provider_services
  for update using (
    exists (select 1 from public.providers pr where pr.id = provider_id and pr.user_id = auth.uid())
    or public.is_admin()
  ) with check (
    exists (select 1 from public.providers pr where pr.id = provider_id and pr.user_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists provider_services_delete on public.provider_services;
create policy provider_services_delete on public.provider_services
  for delete using (
    exists (select 1 from public.providers pr where pr.id = provider_id and pr.user_id = auth.uid())
    or public.is_admin()
  );


-- 2) Cotizaciones ------------------------------------------------------------
create table if not exists public.quote_requests (
  id          uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,  -- quien solicita
  nombre      text not null,
  contacto    text not null,  -- correo o teléfono de contacto
  mensaje     text not null,
  estado      text not null default 'nueva'
                check (estado in ('nueva', 'atendida', 'descartada')),
  created_at  timestamptz not null default now()
);

create index if not exists quote_requests_provider_idx
  on public.quote_requests (provider_id, estado);

alter table public.quote_requests enable row level security;

-- Un usuario autenticado crea su cotización, SOLO si el proveedor es visible
-- (en prueba o activo). Un proveedor suspendido deja de recibir cotizaciones.
drop policy if exists quote_requests_insert on public.quote_requests;
create policy quote_requests_insert on public.quote_requests
  for insert with check (
    auth.uid() = user_id
    and estado = 'nueva'
    and exists (
      select 1 from public.providers pr
      where pr.id = provider_id and pr.estado in ('en_prueba', 'activo')
    )
  );

-- El dueño del proveedor ve las cotizaciones recibidas; el solicitante ve las
-- suyas; admin ve todo.
drop policy if exists quote_requests_select on public.quote_requests;
create policy quote_requests_select on public.quote_requests
  for select using (
    exists (select 1 from public.providers pr where pr.id = provider_id and pr.user_id = auth.uid())
    or auth.uid() = user_id
    or public.is_admin()
  );

-- Solo el dueño del proveedor (o admin) cambia el estado de la cotización.
drop policy if exists quote_requests_update on public.quote_requests;
create policy quote_requests_update on public.quote_requests
  for update using (
    exists (select 1 from public.providers pr where pr.id = provider_id and pr.user_id = auth.uid())
    or public.is_admin()
  ) with check (
    exists (select 1 from public.providers pr where pr.id = provider_id and pr.user_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists quote_requests_delete on public.quote_requests;
create policy quote_requests_delete on public.quote_requests
  for delete using (
    exists (select 1 from public.providers pr where pr.id = provider_id and pr.user_id = auth.uid())
    or public.is_admin()
  );


-- 3) Notificación al proveedor por cotización nueva --------------------------
create or replace function public.notify_provider_new_quote()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_owner uuid;
begin
  select user_id into v_owner from public.providers where id = new.provider_id;
  if v_owner is not null then
    insert into public.notifications (user_id, provider_id, tipo, titulo, cuerpo, url)
    values (
      v_owner, new.provider_id, 'cotizacion',
      'Nueva solicitud de cotización',
      new.nombre || ': ' || left(new.mensaje, 80),
      '/proveedor/panel?seccion=cotizaciones'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_provider_new_quote on public.quote_requests;
create trigger trg_notify_provider_new_quote
  after insert on public.quote_requests
  for each row execute function public.notify_provider_new_quote();
