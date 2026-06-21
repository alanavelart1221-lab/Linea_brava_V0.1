-- ============================================================================
-- Línea Brava — Reseñas y calificación de rutas (estrellas 1–5)
-- ============================================================================
-- CÓMO APLICARLO (Supabase → SQL Editor o vía API):
--   Pega TODO este archivo y córrelo. Es idempotente.
--
-- Qué hace:
--   • Crea la tabla route_reviews (una reseña editable por usuario por ruta).
--   • Soporta rutas oficiales (trail_slug) y rutas de comunidad (user_route_id),
--     listo para la Fase 2 sin migrar de nuevo.
--   • RLS: lectura pública; el autor crea/edita/borra la suya; el admin borra
--     cualquiera (reusa is_admin() del 0002 → moderación como en el foro).
-- ============================================================================

create table if not exists public.route_reviews (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  trail_slug    text,
  user_route_id uuid references public.user_routes(id) on delete cascade,
  rating        int not null check (rating between 1 and 5),
  body          text,
  author_name   text not null default 'Miembro',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Exactamente uno de los dos destinos debe estar presente.
  constraint route_reviews_target_chk check (
    (trail_slug is not null and user_route_id is null)
    or (trail_slug is null and user_route_id is not null)
  )
);

-- Una reseña editable por usuario por ruta. Los NULL no chocan en Postgres,
-- así que cada par cuenta solo cuando aplica al tipo de ruta correspondiente.
create unique index if not exists route_reviews_user_trail_uidx
  on public.route_reviews (user_id, trail_slug)
  where trail_slug is not null;

create unique index if not exists route_reviews_user_userroute_uidx
  on public.route_reviews (user_id, user_route_id)
  where user_route_id is not null;

create index if not exists route_reviews_trail_idx
  on public.route_reviews (trail_slug);

create index if not exists route_reviews_userroute_idx
  on public.route_reviews (user_route_id);

-- RLS ------------------------------------------------------------------------
alter table public.route_reviews enable row level security;

-- Lectura pública: las reseñas se ven sin sesión.
drop policy if exists route_reviews_select on public.route_reviews;
create policy route_reviews_select on public.route_reviews
  for select using (true);

-- El usuario crea SU propia reseña.
drop policy if exists route_reviews_insert_own on public.route_reviews;
create policy route_reviews_insert_own on public.route_reviews
  for insert with check (auth.uid() = user_id);

-- El usuario edita SU propia reseña.
drop policy if exists route_reviews_update_own on public.route_reviews;
create policy route_reviews_update_own on public.route_reviews
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Borra el autor o un admin (moderación, consistente con el foro).
drop policy if exists route_reviews_delete on public.route_reviews;
create policy route_reviews_delete on public.route_reviews
  for delete using (auth.uid() = user_id or public.is_admin());
