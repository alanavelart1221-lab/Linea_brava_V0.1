-- ============================================================================
-- Línea Brava — Promociones del proveedor y estadísticas (vistas / contactos)
-- ============================================================================
-- CÓMO APLICARLO (Supabase → SQL Editor → New query → Run):
--   Pega TODO este archivo y córrelo. Es idempotente.
--
-- Qué hace:
--   • Tabla provider_promotions (promos/descuentos con vigencia) + RLS. El
--     público solo ve promos activas y vigentes de proveedores visibles.
--   • Tabla provider_events (vistas de perfil y clics de contacto) + RLS de
--     lectura solo para el dueño/admin. La inserción va por RPC.
--   • RPC track_provider_event(): registra una vista o contacto, excluyendo al
--     propio dueño y a los admins, y solo si el proveedor es visible.
-- ============================================================================


-- 1) Promociones -------------------------------------------------------------
create table if not exists public.provider_promotions (
  id           uuid primary key default gen_random_uuid(),
  provider_id  uuid not null references public.providers(id) on delete cascade,
  titulo       text not null,
  descripcion  text,
  descuento    text,          -- libre: "20%", "2x1", "$500 de descuento"
  fecha_inicio date,
  fecha_fin    date,
  activo       boolean not null default true,
  created_at   timestamptz not null default now()
);

create index if not exists provider_promotions_provider_idx
  on public.provider_promotions (provider_id);

alter table public.provider_promotions enable row level security;

-- El público ve promos activas y vigentes de proveedores visibles; el dueño ve
-- todas las suyas; admin todo.
drop policy if exists provider_promotions_select on public.provider_promotions;
create policy provider_promotions_select on public.provider_promotions
  for select using (
    public.is_admin()
    or exists (select 1 from public.providers pr where pr.id = provider_id and pr.user_id = auth.uid())
    or (
      activo
      and (fecha_inicio is null or fecha_inicio <= current_date)
      and (fecha_fin is null or fecha_fin >= current_date)
      and exists (
        select 1 from public.providers pr
        where pr.id = provider_id and pr.estado in ('en_prueba', 'activo')
      )
    )
  );

drop policy if exists provider_promotions_insert on public.provider_promotions;
create policy provider_promotions_insert on public.provider_promotions
  for insert with check (
    exists (select 1 from public.providers pr where pr.id = provider_id and pr.user_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists provider_promotions_update on public.provider_promotions;
create policy provider_promotions_update on public.provider_promotions
  for update using (
    exists (select 1 from public.providers pr where pr.id = provider_id and pr.user_id = auth.uid())
    or public.is_admin()
  ) with check (
    exists (select 1 from public.providers pr where pr.id = provider_id and pr.user_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists provider_promotions_delete on public.provider_promotions;
create policy provider_promotions_delete on public.provider_promotions
  for delete using (
    exists (select 1 from public.providers pr where pr.id = provider_id and pr.user_id = auth.uid())
    or public.is_admin()
  );


-- 2) Eventos (estadísticas) --------------------------------------------------
create table if not exists public.provider_events (
  id          uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  tipo        text not null check (tipo in ('vista', 'contacto')),
  created_at  timestamptz not null default now()
);

create index if not exists provider_events_provider_idx
  on public.provider_events (provider_id, tipo, created_at);

alter table public.provider_events enable row level security;

-- Solo el dueño del proveedor (o admin) lee sus estadísticas. No hay política de
-- insert: los eventos entran exclusivamente por la RPC track_provider_event.
drop policy if exists provider_events_select on public.provider_events;
create policy provider_events_select on public.provider_events
  for select using (
    exists (select 1 from public.providers pr where pr.id = provider_id and pr.user_id = auth.uid())
    or public.is_admin()
  );


-- 3) RPC: registrar un evento (vista / contacto) -----------------------------
-- SECURITY DEFINER para poder insertar saltando el RLS (no hay policy de insert).
-- No cuenta al propio dueño ni a admins, y solo cuenta proveedores visibles.
create or replace function public.track_provider_event(p_provider_id uuid, p_tipo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_owner uuid; v_estado proveedor_estado;
begin
  if p_tipo not in ('vista', 'contacto') then
    return;
  end if;

  select user_id, estado into v_owner, v_estado
  from public.providers where id = p_provider_id;

  if v_owner is null then return; end if;                 -- no existe
  if v_estado not in ('en_prueba', 'activo') then return; end if;  -- no visible
  if auth.uid() = v_owner or public.is_admin() then return; end if; -- no inflar

  insert into public.provider_events (provider_id, tipo)
  values (p_provider_id, p_tipo);
end;
$$;

grant execute on function public.track_provider_event(uuid, text) to anon, authenticated;
