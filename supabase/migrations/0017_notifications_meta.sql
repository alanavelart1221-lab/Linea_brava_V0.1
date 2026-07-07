-- ============================================================
-- La tabla notifications (0010) no tiene columna meta, pero
-- confirm_order_payment (0014) inserta en ella: sin esta columna
-- la confirmación de pago falla y la orden queda en 'pendiente'.
-- ============================================================

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS meta JSONB;
