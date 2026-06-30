import Link from "next/link";
import Image from "next/image";
import { AddToCartButton } from "./AddToCartButton";
import { MARKETPLACE_CATEGORIES, type MarketplaceProduct } from "@/lib/providers";

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

export function MarketplaceProductCard({ product }: { product: MarketplaceProduct }) {
  return (
    <article className="card-line flex flex-col overflow-hidden transition-all duration-300 hover:border-ink-600 hover:shadow-lift">
      {/* Imagen */}
      <Link href={`/marketplace/${product.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-ink-800">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-mute">
              <span className="text-4xl">📦</span>
              <span className="text-xs">Sin imagen</span>
            </div>
          )}
          {/* Categoría chip sobre imagen */}
          {product.category && product.category !== "todos" && (
            <span className="absolute left-3 top-3 rounded-full border border-trail-500/40 bg-ink-950/80 px-2.5 py-0.5 text-xs font-semibold text-trail-400 backdrop-blur-sm">
              {categoryLabel(product.category)}
            </span>
          )}
          {/* Sin stock */}
          {product.stock !== null && product.stock <= 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink-950/60 backdrop-blur-sm">
              <span className="rounded-full bg-ink-800 px-4 py-1.5 text-sm font-semibold text-mute">
                Sin stock
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Contenido */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Link href={`/marketplace/${product.id}`}>
          <h3 className="font-display text-lg leading-tight text-bone transition-colors hover:text-trail-400 line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {product.description && (
          <p className="text-sm text-mute line-clamp-2">{product.description}</p>
        )}

        {/* Precio */}
        {product.price !== null ? (
          <p className="font-display text-xl text-trail-400">
            {fmtMxn(product.price)}
          </p>
        ) : (
          <p className="text-sm text-mute">Precio a consultar</p>
        )}

        {/* Proveedor */}
        <Link
          href={`/proveedores/${product.provider_id}`}
          className="flex items-center gap-2 group/prov"
        >
          {product.provider_logo_url ? (
            <div className="relative h-6 w-6 overflow-hidden rounded-full border border-ink-600">
              <Image
                src={product.provider_logo_url}
                alt={product.provider_name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-ink-600 bg-ink-700 text-[10px] font-bold text-mute">
              {providerInitials(product.provider_name)}
            </div>
          )}
          <span className="text-xs text-mute transition-colors group-hover/prov:text-bone">
            {product.provider_name}
          </span>
        </Link>

        {/* CTA */}
        <div className="mt-auto pt-1">
          <AddToCartButton product={product} className="w-full justify-center text-sm" />
        </div>
      </div>
    </article>
  );
}
