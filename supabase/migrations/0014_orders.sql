-- ============================================================
-- 0014_orders.sql
-- Tablas de órdenes de compra para el marketplace interno.
-- Mercado Pago procesa el pago; nosotros almacenamos la orden
-- y sus ítems con snapshot de precios.
-- ============================================================

-- Tabla principal de órdenes
CREATE TABLE IF NOT EXISTS public.orders (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id         UUID           NOT NULL REFERENCES auth.users(id),
  status           TEXT           NOT NULL DEFAULT 'pendiente'
                                    CHECK (status IN (
                                      'pendiente',   -- creada, esperando pago
                                      'pagado',      -- MP confirmó el pago
                                      'enviando',    -- proveedor marcó como enviado
                                      'entregado',   -- comprador confirmó recepción
                                      'cancelado'    -- cancelada antes de pago
                                    )),
  total_mxn        NUMERIC(10,2)  NOT NULL,
  shipping_address JSONB          NOT NULL,  -- {nombre, calle, colonia, ciudad, estado, cp, telefono}
  mp_preference_id TEXT,                     -- ID de preferencia de MP
  mp_payment_id    TEXT,                     -- ID del pago confirmado por MP
  mp_status        TEXT,                     -- status raw de MP (approved/pending/rejected)
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
  paid_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS orders_buyer_idx    ON public.orders (buyer_id);
CREATE INDEX IF NOT EXISTS orders_status_idx   ON public.orders (status);
CREATE INDEX IF NOT EXISTS orders_mp_pref_idx  ON public.orders (mp_preference_id);

-- Ítems de la orden: snapshot de precios al momento de la compra
CREATE TABLE IF NOT EXISTS public.order_items (
  id                UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID           NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider_id       UUID           NOT NULL REFERENCES public.providers(id),
  product_id        UUID           REFERENCES public.provider_products(id) ON DELETE SET NULL,
  product_name      TEXT           NOT NULL,   -- snapshot del nombre
  product_image_url TEXT,                      -- snapshot de la imagen
  unit_price        NUMERIC(10,2)  NOT NULL,
  quantity          INT            NOT NULL DEFAULT 1 CHECK (quantity > 0),
  subtotal          NUMERIC(10,2)  NOT NULL
);

CREATE INDEX IF NOT EXISTS order_items_order_idx    ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS order_items_provider_idx ON public.order_items (provider_id);

-- ============================================================
-- RLS — orders
-- ============================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "buyer sees own orders"
  ON public.orders FOR SELECT
  USING (buyer_id = auth.uid());

CREATE POLICY "buyer inserts own order"
  ON public.orders FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

-- Solo sistema/webhook puede actualizar (via service_role o SECURITY DEFINER)
CREATE POLICY "admin manages all orders"
  ON public.orders FOR ALL
  USING (is_admin());

-- ============================================================
-- RLS — order_items
-- ============================================================
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Comprador ve los ítems de sus órdenes
CREATE POLICY "buyer sees own items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.buyer_id = auth.uid()
    )
  );

-- Proveedor ve solo los ítems que le corresponden
CREATE POLICY "provider sees own items"
  ON public.order_items FOR SELECT
  USING (
    provider_id IN (
      SELECT id FROM public.providers WHERE user_id = auth.uid()
    )
  );

-- INSERT solo cuando el buyer es el dueño de la orden
CREATE POLICY "buyer inserts items"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.buyer_id = auth.uid()
    )
  );

CREATE POLICY "admin manages all items"
  ON public.order_items FOR ALL
  USING (is_admin());

-- ============================================================
-- Trigger: descontar stock al confirmar pago
-- ============================================================
CREATE OR REPLACE FUNCTION public.decrement_stock_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo actuar cuando la orden pasa de 'pendiente' a 'pagado'
  IF NEW.status = 'pagado' AND OLD.status = 'pendiente' THEN
    UPDATE public.provider_products pp
    SET stock = pp.stock - oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = pp.id
      AND pp.stock IS NOT NULL;   -- NULL significa stock ilimitado
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_paid ON public.orders;
CREATE TRIGGER on_order_paid
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_stock_on_payment();

-- ============================================================
-- RPC: confirmar pago (llamada desde webhook, service_role)
-- ============================================================
CREATE OR REPLACE FUNCTION public.confirm_order_payment(
  p_order_id      UUID,
  p_mp_payment_id TEXT,
  p_mp_status     TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider_id UUID;
  v_order_buyer UUID;
BEGIN
  -- Actualizar la orden
  UPDATE public.orders
  SET
    status         = 'pagado',
    mp_payment_id  = p_mp_payment_id,
    mp_status      = p_mp_status,
    paid_at        = now()
  WHERE id = p_order_id
    AND status = 'pendiente';

  -- Notificar a cada proveedor involucrado en la orden
  FOR v_provider_id, v_order_buyer IN
    SELECT DISTINCT oi.provider_id, o.buyer_id
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.order_id = p_order_id
  LOOP
    INSERT INTO public.notifications (user_id, tipo, titulo, cuerpo, meta)
    SELECT
      p.user_id,
      'pedido_nuevo',
      'Nuevo pedido recibido',
      'Tienes un nuevo pedido. Revisa tu panel para ver los detalles y coordinar el envío.',
      jsonb_build_object('order_id', p_order_id)
    FROM public.providers p
    WHERE p.id = v_provider_id;
  END LOOP;
END;
$$;
