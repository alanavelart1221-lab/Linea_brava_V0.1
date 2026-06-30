import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AddToCartButton } from "@/components/AddToCartButton";
import { createClient } from "@/lib/supabase/server";
import {
  ESTADOS_PUBLICOS,
  MARKETPLACE_CATEGORIES,
  TYPE_META,
  type MarketplaceProduct,
} from "@/lib/providers";

export const dynamic = "force-dynamic";

function fmtMxn(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(amount);
}

function categoryLabel(id: string | null): string {
  if (!id) return "";
  return MARKETPLACE_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

function providerInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function sourcePlatformLabel(platform: string, providerName: string): string {
  if (platform === "mercadolibre") return "MercadoLibre";
  return providerName;
}

export default async function MarketplaceProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("provider_products")
    .select(
      `
      id, provider_id, name, description, price, currency,
      image_url, external_url, source_platform, source_id,
      category, stock, active, created_at,
      providers!inner (
        id, name, logo_url, type, estado, state, city
      )
    `
    )
    .eq("id", id)
    .eq("active", true)
    .single();

  if (!row) notFound();

  const prov = Array.isArray(row.providers) ? row.providers[0] : row.providers;
  if (!prov || !ESTADOS_PUBLICOS.includes(prov.estado as never)) notFound();

  const product: MarketplaceProduct = {
    id:              row.id,
    provider_id:     row.provider_id,
    name:            row.name,
    description:     row.description,
    price:           row.price,
    currency:        row.currency,
    image_url:       row.image_url,
    external_url:    row.external_url,
    source_platform: row.source_platform,
    source_id:       row.source_id,
    category:        row.category,
    stock:           row.stock,
    active:          row.active,
    created_at:      row.created_at,
    provider_name:    prov.name,
    provider_logo_url: prov.logo_url,
    provider_type:    prov.type,
  };

  const typeMeta = TYPE_META[prov.type as keyof typeof TYPE_META];
  const outOfStock = product.stock !== null && product.stock <= 0;

  return (
    <>
      <Navbar />
      <main className="min-h-screen pb-20 pt-28">
        <div className="shell">
          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center gap-2 text-sm text-mute">
            <Link href="/marketplace" className="hover:text-bone transition-colors">
              Marketplace
            </Link>
            <span>/</span>
            <span className="text-bone line-clamp-1">{product.name}</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-2">
            {/* Imagen */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-ink-800">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-mute">
                  <span className="text-6xl">📦</span>
                  <span className="text-sm">Sin imagen disponible</span>
                </div>
              )}
              {outOfStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-ink-950/60 backdrop-blur-sm">
                  <span className="rounded-full bg-ink-800 px-6 py-2 font-display text-xl text-mute">
                    Sin stock
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col gap-6">
              {/* Categoría */}
              {product.category && product.category !== "todos" && (
                <span className="inline-flex w-fit rounded-full border border-trail-500/40 bg-trail-500/10 px-3 py-1 text-xs font-semibold text-trail-400">
                  {categoryLabel(product.category)}
                </span>
              )}

              {/* Nombre */}
              <h1 className="font-display text-4xl leading-tight text-bone">
                {product.name}
              </h1>

              {/* Precio */}
              {product.price !== null ? (
                <p className="font-display text-4xl text-trail-400">
                  {fmtMxn(product.price)}
                  {product.currency !== "MXN" && (
                    <span className="ml-2 text-lg text-mute">{product.currency}</span>
                  )}
                </p>
              ) : (
                <p className="text-mute">Precio a consultar</p>
              )}

              {/* Stock */}
              {product.stock !== null && (
                <p className={`text-sm ${outOfStock ? "text-red-400" : "text-go-400"}`}>
                  {outOfStock ? "Sin stock disponible" : `${product.stock} disponibles`}
                </p>
              )}

              {/* Descripción */}
              {product.description && (
                <p className="text-sm leading-relaxed text-mute">{product.description}</p>
              )}

              {/* CTA */}
              <div className="flex flex-col gap-3">
                <AddToCartButton product={product} className="w-full justify-center" />
                {product.external_url && (
                  <a
                    href={product.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost w-full justify-center text-sm"
                  >
                    Ver en {sourcePlatformLabel(product.source_platform, product.provider_name)} ↗
                  </a>
                )}
              </div>

              {/* Provider card */}
              <div className="rounded-xl border border-ink-700 bg-ink-800/50 p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-mute">
                  Vendido por
                </p>
                <Link
                  href={`/proveedores/${prov.id}`}
                  className="flex items-center gap-3 group"
                >
                  {prov.logo_url ? (
                    <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-ink-600">
                      <Image src={prov.logo_url} alt={prov.name} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-ink-600 bg-ink-700 font-display text-lg text-mute">
                      {providerInitials(prov.name)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-bone transition-colors group-hover:text-trail-400">
                      {prov.name}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-xs ${typeMeta?.className ?? ""}`}>
                        {typeMeta?.label ?? prov.type}
                      </span>
                      <span className="text-xs text-mute">
                        {prov.city}, {prov.state}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
