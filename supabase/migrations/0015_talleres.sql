-- 0015_talleres.sql
-- Campos específicos de talleres (horario, coordenadas) y bandera de
-- verificación (admin-only) en la tabla de proveedores.

-- 1) Columnas nuevas ---------------------------------------------------------
alter table public.providers
  add column if not exists horario    text,
  add column if not exists lat        numeric,
  add column if not exists lng        numeric,
  add column if not exists verificado boolean not null default false;

-- 2) Protección de campos privilegiados --------------------------------------
-- Reemplaza protect_provider_fields() (del 0010) para que el dueño tampoco
-- pueda cambiar verificado / lat / lng. El trigger trg_protect_provider_fields
-- ya apunta a esta función, así que no hay que recrearlo.
create or replace function public.protect_provider_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then return new; end if;     -- cron / service_role / SQL editor
  if public.is_admin() then return new; end if;       -- admin todo

  -- Dueño autenticado normal:
  if new.estado is distinct from old.estado
     and not (
       auth.uid() = new.user_id
       and new.estado = 'pendiente'
       and old.estado in ('borrador', 'info_pendiente', 'rechazado')
     ) then
    raise exception 'No autorizado para cambiar el estado del proveedor';
  end if;

  if new.featured    is distinct from old.featured
     or new.trial_start is distinct from old.trial_start
     or new.trial_end   is distinct from old.trial_end
     or new.approved_at is distinct from old.approved_at
     or new.verificado  is distinct from old.verificado
     or new.lat         is distinct from old.lat
     or new.lng         is distinct from old.lng then
    raise exception 'No autorizado para cambiar campos privilegiados del proveedor';
  end if;

  return new;
end;
$$;
