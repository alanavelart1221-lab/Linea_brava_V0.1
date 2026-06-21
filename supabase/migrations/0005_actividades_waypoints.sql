-- ============================================================================
-- Línea Brava — Actividades privadas + waypoints
-- ============================================================================
-- CÓMO APLICARLO: pega TODO y córrelo (SQL Editor o API). Es idempotente.
--
-- Qué hace:
--   • Crea user_activities: el registro PRIVADO de cada grabación del app.
--     RLS solo-dueño (nadie más la ve). Puede ligarse a una ruta pública
--     (route_id) si el usuario decide "Crear ruta".
--   • Agrega user_routes.waypoints para que la ruta publicada lleve sus puntos.
--
-- Forma de un waypoint (jsonb):
--   { "lat": number, "lng": number, "name": string,
--     "category": "peligro"|"vista"|"agua"|"combustible"|"campamento"|"otro" }
-- ============================================================================

-- 1) Tabla de actividades privadas -------------------------------------------
create table if not exists public.user_activities (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text,
  track       jsonb not null,
  waypoints   jsonb not null default '[]',
  distance_km numeric(10,2),
  duration_s  integer,
  started_at  timestamptz,
  route_id    uuid references public.user_routes(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists user_activities_user_idx
  on public.user_activities (user_id, created_at desc);

-- 2) RLS: solo el dueño ve y maneja sus actividades --------------------------
alter table public.user_activities enable row level security;

drop policy if exists user_activities_select_own on public.user_activities;
create policy user_activities_select_own on public.user_activities
  for select using (auth.uid() = user_id);

drop policy if exists user_activities_insert_own on public.user_activities;
create policy user_activities_insert_own on public.user_activities
  for insert with check (auth.uid() = user_id);

drop policy if exists user_activities_update_own on public.user_activities;
create policy user_activities_update_own on public.user_activities
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists user_activities_delete_own on public.user_activities;
create policy user_activities_delete_own on public.user_activities
  for delete using (auth.uid() = user_id);

-- 3) Waypoints en las rutas públicas -----------------------------------------
alter table public.user_routes
  add column if not exists waypoints jsonb not null default '[]';
