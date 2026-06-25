-- ============================================================================
-- Línea Brava — Conteo de miembros para las stats del home
-- ============================================================================
-- CÓMO APLICARLO (Supabase → SQL Editor o vía API):
--   Pega TODO este archivo y córrelo. Es idempotente.
--
-- Qué hace:
--   • Crea la función home_member_count(): cuenta filas de profiles.
--   • SECURITY DEFINER para no exponer las filas de profiles por RLS — solo
--     devuelve el total. Patrón análogo a los RPC de admin del 0002.
--   • La web (clave anon) la usa para el bloque de stats del home.
-- ============================================================================

create or replace function public.home_member_count()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*) from public.profiles;
$$;

grant execute on function public.home_member_count() to anon, authenticated;
