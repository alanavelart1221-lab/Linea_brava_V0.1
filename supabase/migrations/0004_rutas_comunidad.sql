-- ============================================================================
-- Línea Brava — Rutas de comunidad públicas + nivel "calificada"
-- ============================================================================
-- CÓMO APLICARLO: pega TODO y córrelo (SQL Editor o API). Es idempotente.
--
-- Qué hace:
--   • Agrega user_routes.calificada (distintivo que marca el admin).
--   • RLS SELECT incluye al admin (para ver ocultas/pendientes en su panel).
--   • Corrige la política UPDATE de admin: usa is_admin() (no la columna vieja
--     profiles.is_admin, que ya no se mantiene al nombrar admins por rol).
--   • Trigger: solo el admin puede poner/cambiar `calificada`.
--   • El estado 'oculta' (texto) sirve para ocultar sin borrar (reversible);
--     deja de ser público porque no es 'approved'.
-- ============================================================================

-- 1) Columna calificada ------------------------------------------------------
alter table public.user_routes
  add column if not exists calificada boolean not null default false;

-- 2) SELECT: público ve aprobadas; dueño ve las suyas; admin ve todo ---------
drop policy if exists "Ver rutas propias o aprobadas" on public.user_routes;
create policy "Ver rutas propias o aprobadas" on public.user_routes
  for select using (
    status = 'approved' or auth.uid() = user_id or public.is_admin()
  );

-- 3) UPDATE admin: usar is_admin() (cubre admin y superadmin) ----------------
drop policy if exists "Admin puede editar cualquier ruta" on public.user_routes;
create policy "Admin puede editar cualquier ruta" on public.user_routes
  for update using (public.is_admin()) with check (public.is_admin());

-- 4) Solo el admin marca `calificada` ----------------------------------------
create or replace function public.protect_route_calificada()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.calificada is true and not public.is_admin() then
      raise exception 'Solo un admin puede marcar una ruta como calificada';
    end if;
  elsif tg_op = 'UPDATE' then
    if new.calificada is distinct from old.calificada and not public.is_admin() then
      raise exception 'Solo un admin puede cambiar el estado de calificada';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_route_calificada on public.user_routes;
create trigger trg_protect_route_calificada
  before insert or update on public.user_routes
  for each row execute function public.protect_route_calificada();
