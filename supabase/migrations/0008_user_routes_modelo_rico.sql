-- ============================================================================
-- Línea Brava — Modelo rico unificado en user_routes
-- ============================================================================
-- Unifica rutas oficiales y de comunidad en una sola tabla. Agrega los campos
-- que faltaban para las oficiales (slug, blurb, gear, terrain, duration,
-- best_season) y un discriminador `origen`. Rellena las 8 oficiales desde
-- lib/data.ts. Idempotente.
-- ============================================================================

alter table public.user_routes
  add column if not exists slug text,
  add column if not exists blurb text,
  add column if not exists gear jsonb not null default '[]'::jsonb,
  add column if not exists terrain jsonb not null default '[]'::jsonb,
  add column if not exists duration text,
  add column if not exists best_season text,
  add column if not exists origen text not null default 'comunidad';

alter table public.user_routes
  drop constraint if exists user_routes_origen_check;
alter table public.user_routes
  add constraint user_routes_origen_check check (origen in ('oficial','comunidad'));

-- slug único solo cuando existe (las de comunidad lo dejan null)
create unique index if not exists user_routes_slug_key
  on public.user_routes (slug) where slug is not null;

-- ---- Backfill de las 8 rutas oficiales -------------------------------------
update public.user_routes set
  slug='canon-del-diablo', origen='oficial', duration='Día completo', best_season='Oct – Abr',
  blurb='Jardines de roca técnicos y un cruce de río que humilla a las camionetas nuevas. La joya de la corona del calendario.',
  terrain='["Roca","Cruce de río","Cañón"]'::jsonb,
  gear='["Llantas A/T en buen estado","Tanque lleno + reserva","Agua y víveres","Radio o señal celular","Tablas de tracción","Compresor de aire","Kit de parches","Diferencial trasero bloqueado","Protecciones bajas (skid plates)","Winch recomendado","Spotter"]'::jsonb
  where name='Cañón del Diablo';

update public.user_routes set
  slug='sierra-gorda', origen='oficial', duration='6 – 7 hrs', best_season='Todo el año',
  blurb='Cresta de terracería entre bosque de niebla, con curvas panorámicas. Rápida, fluida y perdonadora — ideal para debutantes.',
  terrain='["Terracería","Bosque de niebla","Cresta"]'::jsonb,
  gear='["Llantas A/T en buen estado","Tanque lleno + reserva","Agua y víveres","Radio o señal celular","Tablas de tracción","Compresor de aire","Kit de parches"]'::jsonb
  where name='Sierra Gorda';

update public.user_routes set
  slug='laguna-salada', origen='oficial', duration='Una noche', best_season='Nov – Mar',
  blurb='Un clásico overland. Acampa bajo cielo sin contaminación lumínica tras un día manejando sobre el lecho seco y espejeante.',
  terrain='["Lecho seco","Planicie","Arena"]'::jsonb,
  gear='["Llantas A/T en buen estado","Tanque lleno + reserva","Agua y víveres","Radio o señal celular"]'::jsonb
  where name='Laguna Salada';

update public.user_routes set
  slug='barrancas-del-cobre', origen='oficial', duration='2 días', best_season='Mar – Nov',
  blurb='Territorio de rescate con winch. Diferenciales bloqueados, low range y un spotter no se negocian. Solo en convoy.',
  terrain='["Cañón profundo","Roca suelta","Vados"]'::jsonb,
  gear='["Llantas A/T en buen estado","Tanque lleno + reserva","Agua y víveres","Radio o señal celular","Tablas de tracción","Compresor de aire","Kit de parches","Diferencial trasero bloqueado","Protecciones bajas (skid plates)","Winch recomendado","Spotter","Winch obligatorio","Low range (4L)","Snorkel","Convoy mínimo de 3 vehículos"]'::jsonb
  where name='Barrancas del Cobre';

update public.user_routes set
  slug='dunas-de-samalayuca', origen='oficial', duration='Medio día', best_season='Oct – Abr',
  blurb='Un mar de arena blanca al sur de Juárez. Aprende a desinflar, a flotar sobre el médano y a no enterrarte.',
  terrain='["Dunas de arena","Médanos"]'::jsonb,
  gear='["Llantas A/T en buen estado","Tanque lleno + reserva","Agua y víveres","Radio o señal celular","Tablas de tracción","Compresor de aire","Kit de parches"]'::jsonb
  where name='Dunas de Samalayuca';

update public.user_routes set
  slug='real-de-catorce', origen='oficial', duration='Día completo', best_season='Todo el año',
  blurb='Terracería del altiplano hacia un pueblo fantasma a 2,700 m. Historia minera, desierto y cielos enormes.',
  terrain='["Terracería","Desierto alto","Pueblo minero"]'::jsonb,
  gear='["Llantas A/T en buen estado","Tanque lleno + reserva","Agua y víveres","Radio o señal celular","Tablas de tracción","Compresor de aire","Kit de parches"]'::jsonb
  where name='Real de Catorce';

update public.user_routes set
  slug='valle-de-los-cirios', origen='oficial', duration='Una noche', best_season='Nov – Mar',
  blurb='Overland entre cardones gigantes y campos de roca rosada. El desierto bajacaliforniano en su forma más fotogénica.',
  terrain='["Desierto","Brechas","Boulders"]'::jsonb,
  gear='["Llantas A/T en buen estado","Tanque lleno + reserva","Agua y víveres","Radio o señal celular"]'::jsonb
  where name='Valle de los Cirios';

update public.user_routes set
  slug='nevado-de-toluca', origen='oficial', duration='Día completo', best_season='Nov – Mar',
  blurb='Ascenso de roca volcánica hasta el cráter a 4,200 m. Aire delgado, hielo posible y vistas que cortan la respiración.',
  terrain='["Alta montaña","Roca volcánica","Hielo"]'::jsonb,
  gear='["Llantas A/T en buen estado","Tanque lleno + reserva","Agua y víveres","Radio o señal celular","Tablas de tracción","Compresor de aire","Kit de parches","Diferencial trasero bloqueado","Protecciones bajas (skid plates)","Winch recomendado","Spotter"]'::jsonb
  where name='Nevado de Toluca';
