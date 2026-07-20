-- 0019_providers_admin_insert_y_source_id_unico.sql
--
-- Habilita el alta manual de proveedores desde el panel de admin:
--   1. Policy de INSERT para admin en `providers`. Hasta ahora la unica policy de INSERT era
--      `providers_insert_own` (auth.uid() = user_id AND estado IN ('borrador','pendiente')),
--      lo que hacia imposible crear un proveedor sin dueno o directamente en estado 'activo'.
--      Postgres evalua las policies de INSERT con OR, asi que `providers_insert_own` sigue
--      funcionando igual para el flujo de auto-registro.
--   2. Indice unico parcial en `provider_products (provider_id, source_id)` para poder
--      re-importar catalogos externos sin duplicar (destino del ON CONFLICT del UPSERT).
--      Es parcial: los productos capturados a mano (source_id IS NULL) no se ven afectados.

-- 1. INSERT de admin en providers
drop policy if exists providers_admin_insert on public.providers;

create policy providers_admin_insert
  on public.providers
  for insert
  with check (is_admin());

-- 2. Unicidad de productos importados por fuente
create unique index if not exists provider_products_provider_source_unique
  on public.provider_products (provider_id, source_id)
  where source_id is not null;
