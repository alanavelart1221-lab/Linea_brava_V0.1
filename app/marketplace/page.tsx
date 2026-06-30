import { createClient } from "@/lib/supabase/server";
import { ESTADOS_PUBLICOS, type MarketplaceProduct } from "@/lib/providers";
import { MarketplaceContent } from "./MarketplaceContent";

export const revalidate = 60;

export const metadata = {
  title: "Marketplace Off-Road",
  description:
    "Compra partes, accesorios y equipamiento overland directamente de los mejores proveedores de la comunidad Línea Brava.",
};

export default async function MarketplacePage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("provider_products")
    .select(
      `
      id, provider_id, name, description, price, currency,
      image_url, external_url, source_platform, source_id,
      category, stock, active, created_at,
      providers!inner (
        id, name, logo_url, type, estado
      )
    `
    )
    .eq("active", true)
    .in("providers.estado", ESTADOS_PUBLICOS)
    .order("created_at", { ascending: false })
    .limit(200);

  // Mapear el join al tipo MarketplaceProduct
  const products: MarketplaceProduct[] = (data ?? []).map((row) => {
    const prov = Array.isArray(row.providers) ? row.providers[0] : row.providers;
    return {
      id:               row.id,
      provider_id:      row.provider_id,
      name:             row.name,
      description:      row.description,
      price:            row.price,
      currency:         row.currency,
      image_url:        row.image_url,
      external_url:     row.external_url,
      source_platform:  row.source_platform,
      source_id:        row.source_id,
      category:         row.category,
      stock:            row.stock,
      active:           row.active,
      created_at:       row.created_at,
      provider_name:    prov?.name ?? "Proveedor",
      provider_logo_url: prov?.logo_url ?? null,
      provider_type:    prov?.type ?? "distribuidor",
    };
  });

  return <MarketplaceContent products={products} />;
}
