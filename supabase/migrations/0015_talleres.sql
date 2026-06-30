-- Agrega campos específicos de talleres y verificación a la tabla de proveedores.
alter table public.providers
  add column if not exists horario   text,
  add column if not exists lat       numeric,
  add column if not exists lng       numeric,
  add column if not exists verificado boolean not null default false;

-- Solo admins pueden cambiar verificado, lat y lng.
-- El trigger protect_provider_fields ya bloquea campos privilegiados;
-- ampliamos la lista para incluir los nuevos.
-- Si el trigger ya existe con ese nombre, lo recreamos.
create or replace function public.protect_taller_fields()
returns trigger language plpgsql security definer as $$
begin
  -- Bloquea cambios a verificado/lat/lng por el dueño (no admin).
  -- is_admin() es la función ya definida en el proyecto.
  if not public.is_admin() then
    new.verificado := old.verificado;
    new.lat        := old.lat;
    new.lng        := old.lng;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_taller_fields_trigger on public.providers;
create trigger protect_taller_fields_trigger
  before update on public.providers
  for each row execute function public.protect_taller_fields();
