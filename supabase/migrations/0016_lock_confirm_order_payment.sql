-- ============================================================
-- Restringe confirm_order_payment: solo service_role puede
-- ejecutarla. Sin esto, cualquier usuario con la anon key podía
-- marcar su propia orden como "pagado" sin pagar.
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.confirm_order_payment(UUID, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.confirm_order_payment(UUID, TEXT, TEXT)
  TO service_role;
