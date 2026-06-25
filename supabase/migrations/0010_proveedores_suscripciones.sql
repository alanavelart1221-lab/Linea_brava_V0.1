-- ============================================================================
-- Línea Brava — Proveedores: ciclo de vida, prueba de 60 días y suscripción
-- ============================================================================
-- CÓMO APLICARLO (Supabase → SQL Editor → New query → Run):
--   Pega TODO este archivo y córrelo. Es idempotente: puedes re-correrlo sin
--   romper nada. El enum nuevo (proveedor_estado) se crea y se usa en la misma
--   corrida sin problema (la limitación de dos pasos del 0002 era solo para
--   ALTER TYPE ADD VALUE, no para un CREATE TYPE nuevo).
--
-- Qué hace:
--   • Crea el enum `proveedor_estado` (7 estados) y `providers.estado`.
--   • Agrega columnas del formulario rico y de la prueba/suscripción a providers.
--   • Crea provider_subscriptions y provider_payments (listas para Stripe/Mercado
--     Pago, SIN implementar la pasarela todavía) y notifications.
--   • Trigger protect_provider_fields: el dueño edita su perfil pero NO se
--     auto-aprueba ni alarga su prueba.
--   • Reescribe el RLS de visibilidad pública: estado IN ('en_prueba','activo').
--   • RPCs admin: approve/reject/request_info/suspend/reactivate + notify_admins
--     + expire_provider_trials (job diario).
--   • pg_cron: corre expire_provider_trials() todos los días (ver PASO FINAL).
-- ============================================================================


-- 1) Enum del ciclo de vida del proveedor -----------------------------------
do $$ begin
  create type proveedor_estado as enum (
    'borrador', 'pendiente', 'info_pendiente',
    'en_prueba', 'activo', 'suspendido', 'rechazado'
  );
exception when duplicate_object then null; end $$;


-- 2) Columnas en providers ---------------------------------------------------
-- `estado` es la nueva fuente de verdad del ciclo de vida. La columna `status`
-- (enum estado_proveedor: pendiente|aprobado) queda como LEGACY: el código nuevo
-- ya no la usa. No se borra para no romper datos ni políticas viejas.
alter table public.providers
  add column if not exists estado          proveedor_estado not null default 'borrador',
  add column if not exists email           text,
  add column if not exists whatsapp        text,
  add column if not exists address         text,
  add column if not exists servicios       text[] not null default '{}',
  add column if not exists marcas          text[] not null default '{}',
  add column if not exists social          jsonb  not null default '{}',
  add column if not exists logo_url        text,
  add column if not exists gallery         jsonb  not null default '[]',
  add column if not exists trial_start     timestamptz,
  add column if not exists trial_end       timestamptz,
  add column if not exists rejected_reason text,
  add column if not exists info_requested  text;

-- Backfill desde la columna legacy `status` (solo la primera vez).
update public.providers set estado = 'activo'    where status = 'aprobado'  and estado = 'borrador';
update public.providers set estado = 'pendiente' where status = 'pendiente' and estado = 'borrador';

create index if not exists providers_estado_idx on public.providers (estado);


-- 3) Suscripciones (arquitectura lista para pasarela) ------------------------
create table if not exists public.provider_subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  provider_id             uuid not null unique references public.providers(id) on delete cascade,
  status                  text not null default 'trialing'
                            check (status in ('trialing','active','past_due','canceled')),
  gateway                 text check (gateway in ('stripe','mercadopago')),  -- null hasta integrar
  gateway_subscription_id text,
  gateway_customer_id     text,
  price_mxn               numeric(10,2) not null default 500,
  period_start            timestamptz,
  period_end              timestamptz,
  trial_end               timestamptz,
  cancel_at               timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);


-- 4) Historial de pagos (para implementación futura) -------------------------
create table if not exists public.provider_payments (
  id                uuid primary key default gen_random_uuid(),
  provider_id       uuid not null references public.providers(id) on delete cascade,
  subscription_id   uuid references public.provider_subscriptions(id) on delete set null,
  gateway           text,
  gateway_payment_id text,
  amount_mxn        numeric(10,2) not null,
  currency          text not null default 'MXN',
  status            text not null default 'pending'
                      check (status in ('pending','paid','failed','refunded')),
  paid_at           timestamptz,
  created_at        timestamptz not null default now()
);

create index if not exists provider_payments_provider_idx on public.provider_payments (provider_id);


-- 5) Notificaciones (avisos al admin y recordatorios al proveedor) -----------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,  -- destinatario
  provider_id uuid references public.providers(id) on delete cascade,
  tipo        text not null,  -- 'nueva_solicitud','aprobado','rechazado','info_solicitada','prueba_15','prueba_5','prueba_1','suspendido'
  titulo      text not null,
  cuerpo      text,
  url         text,
  leido       boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, leido);

-- Evita recordatorios duplicados por proveedor (15/5/1 días, suspensión).
create unique index if not exists notifications_recordatorio_uidx
  on public.notifications (provider_id, tipo)
  where tipo in ('prueba_15','prueba_5','prueba_1','suspendido');


-- 6) Trigger: proteger campos privilegiados de providers ---------------------
-- El dueño autenticado puede editar su perfil y reenviar a revisión
-- (borrador/info_pendiente -> pendiente), pero NO cambiar estado a algo
-- privilegiado ni tocar featured / trial_* / approved_at. Los contextos sin
-- sesión (cron, service_role, SQL editor) y los admins no se restringen.
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
       and old.estado in ('borrador', 'info_pendiente')
     ) then
    raise exception 'No autorizado para cambiar el estado del proveedor';
  end if;

  if new.featured    is distinct from old.featured
     or new.trial_start is distinct from old.trial_start
     or new.trial_end   is distinct from old.trial_end
     or new.approved_at is distinct from old.approved_at then
    raise exception 'No autorizado para cambiar campos privilegiados del proveedor';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_provider_fields on public.providers;
create trigger trg_protect_provider_fields
  before update on public.providers
  for each row execute function public.protect_provider_fields();


-- 7) RLS: providers (visibilidad por `estado`) -------------------------------
-- El público ve en_prueba/activo; el admin ve todo; el dueño ve el suyo.
drop policy if exists providers_select on public.providers;
create policy providers_select on public.providers
  for select using (
    estado in ('en_prueba', 'activo') or public.is_admin() or auth.uid() = user_id
  );

-- Un usuario autenticado crea SU propia solicitud (borrador o pendiente).
drop policy if exists providers_insert_own on public.providers;
create policy providers_insert_own on public.providers
  for insert with check (
    auth.uid() = user_id and estado in ('borrador', 'pendiente') and featured = false
  );

-- El dueño actualiza su propia fila; el trigger (6) impide campos privilegiados.
drop policy if exists providers_update_own on public.providers;
create policy providers_update_own on public.providers
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- El admin sigue pudiendo todo (aprobar/rechazar/destacar). (del 0001)
drop policy if exists providers_admin_update on public.providers;
create policy providers_admin_update on public.providers
  for update using (public.is_admin()) with check (public.is_admin());


-- 8) RLS: provider_products (visibilidad por `estado`) -----------------------
drop policy if exists provider_products_select on public.provider_products;
create policy provider_products_select on public.provider_products
  for select using (
    exists (
      select 1 from public.providers pr
      where pr.id = provider_id
        and (pr.estado in ('en_prueba', 'activo') or pr.user_id = auth.uid())
    )
    or public.is_admin()
  );


-- 9) RLS: provider_subscriptions / provider_payments -------------------------
alter table public.provider_subscriptions enable row level security;
alter table public.provider_payments      enable row level security;

-- El dueño del proveedor (o admin) ve su suscripción.
drop policy if exists provider_subscriptions_select on public.provider_subscriptions;
create policy provider_subscriptions_select on public.provider_subscriptions
  for select using (
    exists (select 1 from public.providers pr where pr.id = provider_id and pr.user_id = auth.uid())
    or public.is_admin()
  );
-- Escritura solo admin / RPCs SECURITY DEFINER (no hay política de insert/update
-- para usuarios normales: queda denegada salvo definer).
drop policy if exists provider_subscriptions_admin_write on public.provider_subscriptions;
create policy provider_subscriptions_admin_write on public.provider_subscriptions
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists provider_payments_select on public.provider_payments;
create policy provider_payments_select on public.provider_payments
  for select using (
    exists (select 1 from public.providers pr where pr.id = provider_id and pr.user_id = auth.uid())
    or public.is_admin()
  );
drop policy if exists provider_payments_admin_write on public.provider_payments;
create policy provider_payments_admin_write on public.provider_payments
  for all using (public.is_admin()) with check (public.is_admin());


-- 10) RLS: notifications -----------------------------------------------------
alter table public.notifications enable row level security;

-- El destinatario lee y marca como leído lo suyo. La inserción ocurre solo
-- dentro de funciones SECURITY DEFINER (cron / RPCs), que ignoran RLS.
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- 11) Helper: notificar a todos los admins -----------------------------------
create or replace function public.notify_admins(
  p_tipo text, p_titulo text, p_cuerpo text, p_url text, p_provider_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, provider_id, tipo, titulo, cuerpo, url)
  select p.id, p_provider_id, p_tipo, p_titulo, p_cuerpo, p_url
  from public.profiles p
  where p.rol in ('admin', 'superadmin');
end;
$$;


-- 12) RPCs de moderación de proveedores --------------------------------------
-- Aprobar: inicia la prueba de 60 días, publica el perfil y crea la suscripción.
create or replace function public.approve_provider(p_provider_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_trial_end timestamptz := now() + interval '60 days';
begin
  if not public.is_admin() then
    raise exception 'Solo un admin puede aprobar proveedores';
  end if;

  update public.providers
    set estado = 'en_prueba',
        trial_start = now(),
        trial_end = v_trial_end,
        approved_at = now(),
        rejected_reason = null,
        info_requested = null
    where id = p_provider_id
    returning user_id into v_user;

  if v_user is null then
    raise exception 'Proveedor no encontrado';
  end if;

  update public.profiles set estado_proveedor = 'aprobado' where id = v_user;

  insert into public.provider_subscriptions (provider_id, status, trial_end)
  values (p_provider_id, 'trialing', v_trial_end)
  on conflict (provider_id) do update
    set status = 'trialing', trial_end = excluded.trial_end, updated_at = now();

  insert into public.notifications (user_id, provider_id, tipo, titulo, cuerpo, url)
  values (
    v_user, p_provider_id, 'aprobado',
    '¡Tu negocio fue aprobado!',
    'Tu perfil ya aparece en el directorio. Tienes 60 días de prueba gratis.',
    '/proveedor/panel'
  );
end;
$$;

-- Rechazar: NO borra la fila; deja constancia del motivo.
create or replace function public.reject_provider(p_provider_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_user uuid;
begin
  if not public.is_admin() then
    raise exception 'Solo un admin puede rechazar proveedores';
  end if;

  update public.providers
    set estado = 'rechazado', rejected_reason = nullif(trim(p_reason), '')
    where id = p_provider_id
    returning user_id into v_user;

  if v_user is null then raise exception 'Proveedor no encontrado'; end if;

  insert into public.notifications (user_id, provider_id, tipo, titulo, cuerpo, url)
  values (
    v_user, p_provider_id, 'rechazado',
    'Tu solicitud no fue aprobada',
    coalesce(nullif(trim(p_reason), ''), 'Revisa tu información e intenta de nuevo.'),
    '/proveedor/panel'
  );
end;
$$;

-- Solicitar más información.
create or replace function public.request_provider_info(p_provider_id uuid, p_message text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_user uuid;
begin
  if not public.is_admin() then
    raise exception 'Solo un admin puede solicitar información';
  end if;

  update public.providers
    set estado = 'info_pendiente', info_requested = nullif(trim(p_message), '')
    where id = p_provider_id
    returning user_id into v_user;

  if v_user is null then raise exception 'Proveedor no encontrado'; end if;

  insert into public.notifications (user_id, provider_id, tipo, titulo, cuerpo, url)
  values (
    v_user, p_provider_id, 'info_solicitada',
    'Necesitamos más información',
    coalesce(nullif(trim(p_message), ''), 'Completa tu información y reenvía tu solicitud.'),
    '/proveedor/panel'
  );
end;
$$;

-- Suspender / reactivar manualmente.
create or replace function public.suspend_provider(p_provider_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Solo un admin puede suspender'; end if;
  update public.providers set estado = 'suspendido' where id = p_provider_id;
  update public.provider_subscriptions set status = 'past_due', updated_at = now()
    where provider_id = p_provider_id;
end;
$$;

create or replace function public.reactivate_provider(p_provider_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Solo un admin puede reactivar'; end if;
  -- Reactiva como activo (suscripción al corriente). Si prefieres devolver a
  -- prueba, ajusta aquí.
  update public.providers set estado = 'activo' where id = p_provider_id;
  update public.provider_subscriptions set status = 'active', updated_at = now()
    where provider_id = p_provider_id;
end;
$$;


-- 13) Job diario: recordatorios y suspensión por vencimiento -----------------
-- • Inserta avisos cuando restan 15 / 5 / 1 días de prueba (sin duplicar, gracias
--   al índice único parcial).
-- • Al vencer la prueba sin suscripción activa, pasa a 'suspendido'.
create or replace function public.expire_provider_trials()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_dias int;
begin
  for r in
    select pr.id, pr.user_id, pr.trial_end,
           sub.status as sub_status
    from public.providers pr
    left join public.provider_subscriptions sub on sub.provider_id = pr.id
    where pr.estado = 'en_prueba' and pr.trial_end is not null
  loop
    -- ¿Vencida sin pago activo? -> suspender.
    if r.trial_end < now() and coalesce(r.sub_status, '') <> 'active' then
      update public.providers set estado = 'suspendido' where id = r.id;
      update public.provider_subscriptions set status = 'past_due', updated_at = now()
        where provider_id = r.id;
      insert into public.notifications (user_id, provider_id, tipo, titulo, cuerpo, url)
      values (
        r.user_id, r.id, 'suspendido',
        'Tu prueba terminó',
        'Activa la suscripción de $500 MXN/mes para volver a aparecer en Línea Brava.',
        '/proveedor/panel'
      )
      on conflict (provider_id, tipo) do nothing;
      continue;
    end if;

    -- Recordatorios 15 / 5 / 1 días.
    v_dias := ceil(extract(epoch from (r.trial_end - now())) / 86400.0)::int;
    if v_dias in (15, 5, 1) then
      insert into public.notifications (user_id, provider_id, tipo, titulo, cuerpo, url)
      values (
        r.user_id, r.id, 'prueba_' || v_dias,
        'Tu prueba termina en ' || v_dias || ' día' || case when v_dias = 1 then '' else 's' end,
        'Activa tu suscripción de $500 MXN/mes para seguir apareciendo en el directorio.',
        '/proveedor/panel'
      )
      on conflict (provider_id, tipo) do nothing;
    end if;
  end loop;
end;
$$;


-- 14) Grants -----------------------------------------------------------------
grant execute on function public.reject_provider(uuid, text)        to authenticated;
grant execute on function public.request_provider_info(uuid, text)  to authenticated;
grant execute on function public.suspend_provider(uuid)             to authenticated;
grant execute on function public.reactivate_provider(uuid)          to authenticated;
grant execute on function public.notify_admins(text, text, text, text, uuid) to authenticated;
-- approve_provider ya tenía grant en 0002; lo reafirmamos por si acaso.
grant execute on function public.approve_provider(uuid)             to authenticated;


-- ████████████████████████████████████████████████████████████████████████████
-- PASO FINAL — pg_cron (recordatorios + suspensión automática).
-- Requiere habilitar la extensión pg_cron en Supabase:
--   Dashboard → Database → Extensions → buscar "pg_cron" → Enable.
-- Luego corre este bloque (es idempotente: re-programa el job).
-- ████████████████████████████████████████████████████████████████████████████
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    -- Borra el job anterior si existe (evita duplicados al re-correr).
    perform cron.unschedule('proveedores-vencimientos')
      where exists (select 1 from cron.job where jobname = 'proveedores-vencimientos');
    perform cron.schedule(
      'proveedores-vencimientos',
      '0 9 * * *',  -- todos los días 09:00 UTC
      $cron$ select public.expire_provider_trials(); $cron$
    );
  else
    raise notice 'pg_cron no está habilitado. Habilítalo en Database → Extensions y vuelve a correr este bloque.';
  end if;
end $$;
