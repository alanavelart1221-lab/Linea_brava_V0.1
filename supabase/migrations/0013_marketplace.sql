-- ============================================================
-- 0013_marketplace.sql
-- Extiende provider_products para el marketplace, añade RFC
-- al proveedor, y crea la tabla de fuentes de catálogo importado.
-- ============================================================

-- RFC del proveedor (opcional, 12-13 chars)
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS rfc VARCHAR(13);

-- Campos adicionales en provider_products para el marketplace
ALTER TABLE public.provider_products
  ADD COLUMN IF NOT EXISTS external_url    TEXT,
  ADD COLUMN IF NOT EXISTS source_platform TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_id       TEXT,
  ADD COLUMN IF NOT EXISTS category        TEXT,
  ADD COLUMN IF NOT EXISTS stock           INT,      -- NULL = sin límite de stock
  ADD COLUMN IF NOT EXISTS active          BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS provider_products_category_idx
  ON public.provider_products (category);

CREATE INDEX IF NOT EXISTS provider_products_active_idx
  ON public.provider_products (active);

-- Tabla de fuentes de catálogo importado (MercadoLibre, sitio propio, etc.)
CREATE TABLE IF NOT EXISTS public.provider_catalog_sources (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id        UUID        NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  url                TEXT        NOT NULL,
  platform           TEXT        NOT NULL CHECK (platform IN ('mercadolibre', 'web')),
  seller_id_or_store TEXT,
  last_synced_at     TIMESTAMPTZ,
  product_count      INT         NOT NULL DEFAULT 0,
  status             TEXT        NOT NULL DEFAULT 'pendiente'
                                   CHECK (status IN ('pendiente', 'ok', 'error')),
  error_message      TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS catalog_sources_provider_idx
  ON public.provider_catalog_sources (provider_id);

ALTER TABLE public.provider_catalog_sources ENABLE ROW LEVEL SECURITY;

-- El proveedor dueño puede ver y gestionar sus propias fuentes
CREATE POLICY "owner can manage own sources"
  ON public.provider_catalog_sources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = provider_id
        AND p.user_id = auth.uid()
    )
  );

-- Admins pueden ver y gestionar todas
CREATE POLICY "admin can manage all sources"
  ON public.provider_catalog_sources FOR ALL
  USING (is_admin());
