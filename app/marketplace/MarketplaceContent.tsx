"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MarketplaceProductCard } from "@/components/MarketplaceProductCard";
import {
  MARKETPLACE_CATEGORIES,
  PRECIO_SUSCRIPCION_MXN,
  type MarketplaceCategoryId,
  type MarketplaceProduct,
} from "@/lib/providers";

export function MarketplaceContent({ products }: { products: MarketplaceProduct[] }) {
  const [category, setCategory] = useState<MarketplaceCategoryId>("todos");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((p) => {
      const matchCat = category === "todos" || p.category === category;
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.provider_name.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [products, category, search]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pb-20 pt-28">
        <div className="shell">
          {/* Header */}
          <div className="mb-12">
            <span className="eyebrow mb-4 flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-trail-500" />
              Comunidad off-road
            </span>
            <h1 className="h2 mb-4 text-bone">Marketplace</h1>
            <p className="max-w-xl text-base text-mute">
              Partes, accesorios y equipamiento overland de los mejores proveedores de la
              comunidad. Compra directo en la plataforma.
            </p>
          </div>

          {/* Buscador */}
          <div className="mb-6">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar productos, accesorios, marcas…"
              className="input-field max-w-md"
            />
          </div>

          {/* Filtros de categoría */}
          <div className="mb-8 flex flex-wrap gap-2">
            {MARKETPLACE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  category === cat.id
                    ? "border-trail-500 bg-trail-500 text-ink-950"
                    : "border-ink-700 text-mute hover:border-ink-500 hover:text-bone"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Contador */}
          <p className="mb-6 text-sm text-mute">
            {filtered.length} producto{filtered.length !== 1 ? "s" : ""} encontrado
            {filtered.length !== 1 ? "s" : ""}
          </p>

          {/* Grid de productos */}
          {filtered.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filtered.map((product) => (
                <MarketplaceProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <p className="text-4xl">🔍</p>
              <p className="text-bone">No encontramos productos con ese filtro</p>
              <button
                onClick={() => { setCategory("todos"); setSearch(""); }}
                className="btn-ghost"
              >
                Ver todos
              </button>
            </div>
          )}

          {/* CTA para proveedores */}
          <div
            id="planes"
            className="mt-20 rounded-2xl border border-trail-500/20 bg-trail-500/5 p-8 sm:p-12"
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="eyebrow mb-3 flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-trail-500" />
                  Para proveedores
                </span>
                <h2 className="font-display text-3xl text-bone">
                  ¿Tienes un negocio off-road?
                </h2>
                <p className="mt-2 max-w-md text-sm text-mute">
                  Publica tus productos e importa tu catálogo de MercadoLibre en segundos.
                  60 días de prueba gratis.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:items-end">
                <p className="font-display text-3xl text-trail-400">
                  ${PRECIO_SUSCRIPCION_MXN.toLocaleString("es-MX")}{" "}
                  <span className="text-base font-sans text-mute">MXN/mes</span>
                </p>
                <Link href="/proveedores/registro" className="btn-primary whitespace-nowrap">
                  Publicar mi negocio
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
