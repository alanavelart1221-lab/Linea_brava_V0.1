import { supabase } from "./supabase";

export type ProviderType = "taller" | "distribuidor" | "guia" | "eventos" | "equipo";

export const TYPE_LABEL: Record<ProviderType, string> = {
  taller: "Taller 4×4",
  distribuidor: "Distribuidora",
  guia: "Guía de Ruta",
  eventos: "Organizador de Eventos",
  equipo: "Equipo Overland",
};

export interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  state: string;
  city: string;
  description: string;
  specialty: string[];
  phone: string;
  website: string | null;
  featured: boolean;
}

export interface ProviderProduct {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  image_url: string | null;
}

// Producto con datos del proveedor, usado en la pantalla de detalle.
export interface ProductDetail extends ProviderProduct {
  category: string | null;
  stock: number | null;
  provider_id: string;
  provider_name: string;
}

export async function fetchProviders(): Promise<Provider[]> {
  const { data } = await supabase
    .from("providers")
    .select("id, name, type, state, city, description, specialty, phone, website, featured")
    .eq("status", "aprobado")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });
  return ((data as Provider[] | null) ?? []).map((p) => ({ ...p, specialty: p.specialty ?? [] }));
}

export async function fetchProvider(id: string): Promise<{
  provider: Provider | null;
  products: ProviderProduct[];
}> {
  const [{ data: provider }, { data: products }] = await Promise.all([
    supabase
      .from("providers")
      .select("id, name, type, state, city, description, specialty, phone, website, featured")
      .eq("id", id)
      .single(),
    supabase
      .from("provider_products")
      .select("id, name, description, price, currency, image_url")
      .eq("provider_id", id)
      .order("created_at", { ascending: false }),
  ]);
  return {
    provider: (provider as Provider | null) ?? null,
    products: (products as ProviderProduct[] | null) ?? [],
  };
}

export async function fetchProduct(id: string): Promise<ProductDetail | null> {
  const { data } = await supabase
    .from("provider_products")
    .select(
      "id, name, description, price, currency, image_url, category, stock, provider_id, providers!inner(name)"
    )
    .eq("id", id)
    .eq("active", true)
    .single();

  if (!data) return null;

  type Raw = Omit<ProductDetail, "provider_name"> & {
    providers: { name: string } | { name: string }[] | null;
  };
  const row = data as unknown as Raw;
  const prov = Array.isArray(row.providers) ? row.providers[0] : row.providers;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    currency: row.currency,
    image_url: row.image_url,
    category: row.category,
    stock: row.stock,
    provider_id: row.provider_id,
    provider_name: prov?.name ?? "Proveedor",
  };
}
