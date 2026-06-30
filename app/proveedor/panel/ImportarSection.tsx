"use client";

import Image from "next/image";
import { useState } from "react";
import { saveImportedProducts, type ImportedProductInput } from "@/app/proveedor/actions";
import type { ImportResponse, ImportedProduct } from "@/app/api/marketplace/import/route";
import { MARKETPLACE_CATEGORIES } from "@/lib/providers";

type Step = "url" | "preview" | "done";

function fmtMxn(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function ImportarSection({ providerId }: { providerId: string }) {
  const [step, setStep] = useState<Step>("url");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [savedCount, setSavedCount] = useState(0);
  // Category overrides per product index
  const [categories, setCategories] = useState<Record<number, string>>({});

  async function handleImport() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/marketplace/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, providerId }),
      });
      const data: ImportResponse = await res.json();
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }
      setResult(data);
      // Pre-seleccionar todos
      setSelected(new Set(data.products.map((_, i) => i)));
      setStep("preview");
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!result) return;
    setLoading(true);
    setError(null);

    const toSave: ImportedProductInput[] = result.products
      .filter((_, i) => selected.has(i))
      .map((p: ImportedProduct, i: number) => ({
        name:         p.name,
        description:  p.description,
        price:        p.price,
        image_url:    p.image_url,
        external_url: p.external_url,
        source_id:    p.source_id,
        category:     categories[i] ?? p.category,
      }));

    const res = await saveImportedProducts(providerId, toSave, {
      url,
      platform: result.platform,
      seller_id_or_store: result.seller_id_or_store,
    });

    if (res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }

    setSavedCount(res.count);
    setStep("done");
    setLoading(false);
  }

  function reset() {
    setStep("url");
    setUrl("");
    setResult(null);
    setSelected(new Set());
    setError(null);
    setCategories({});
  }

  function toggleSelect(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  // Step 1 — URL input
  if (step === "url") {
    return (
      <div className="flex flex-col gap-8">
        <div>
          <h2 className="font-display text-3xl text-bone">Importar catálogo</h2>
          <p className="mt-2 max-w-lg text-sm text-mute">
            Pega la URL de tu tienda en MercadoLibre o de tu sitio web. Importaremos tus
            productos automáticamente y podrás elegir cuáles publicar en el marketplace.
          </p>
        </div>

        <div className="card-line flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-bone" htmlFor="import-url">
              URL de tu tienda o catálogo
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="import-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.mercadolibre.com.mx/tienda/TuTienda"
                className="input-field flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleImport()}
              />
              <button
                onClick={handleImport}
                disabled={loading || !url.trim()}
                className="btn-primary disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? "Importando…" : "Importar"}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2 rounded-xl bg-ink-800/50 p-4">
            <p className="text-xs font-semibold text-bone">URLs compatibles</p>
            <ul className="flex flex-col gap-1 text-xs text-mute">
              <li>✓ Tienda de MercadoLibre: <code className="text-trail-400">mercadolibre.com.mx/tienda/NombreTienda</code></li>
              <li>✓ Página de producto individual en ML</li>
              <li>✓ Sitio web propio con schema.org Product o Open Graph</li>
              <li>✗ Amazon (próximamente)</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Step 3 — Done
  if (step === "done") {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-go-500/15">
          <span className="text-3xl text-go-400">✓</span>
        </div>
        <div>
          <h2 className="font-display text-3xl text-bone">¡Listo!</h2>
          <p className="mt-2 text-mute">
            Se importaron <strong className="text-bone">{savedCount} productos</strong> a tu catálogo.
            Ya están visibles en el marketplace.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a href="/marketplace" target="_blank" className="btn-primary">
            Ver en marketplace ↗
          </a>
          <button onClick={reset} className="btn-ghost">
            Importar más
          </button>
        </div>
      </div>
    );
  }

  // Step 2 — Preview
  const products = result?.products ?? [];
  const platformLabel = result?.platform === "mercadolibre" ? "MercadoLibre" : "Sitio web";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-3xl text-bone">
            {products.length} producto{products.length !== 1 ? "s" : ""} encontrado
            {products.length !== 1 ? "s" : ""}
          </h2>
          <p className="text-sm text-mute">
            Fuente: <span className="text-bone">{platformLabel}</span>
            {result?.seller_id_or_store && (
              <> — {result.seller_id_or_store}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelected(new Set(products.map((_, i) => i)))}
            className="text-sm text-mute hover:text-bone"
          >
            Todos
          </button>
          <span className="text-ink-600">|</span>
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm text-mute hover:text-bone"
          >
            Ninguno
          </button>
          <span className="text-xs text-mute">({selected.size} seleccionados)</span>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {/* Grid de previsualización */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p: ImportedProduct, i: number) => (
          <div
            key={i}
            onClick={() => toggleSelect(i)}
            className={`card-line cursor-pointer flex flex-col overflow-hidden transition-all ${
              selected.has(i)
                ? "border-trail-500/60 ring-1 ring-trail-500/30"
                : "opacity-60"
            }`}
          >
            <div className="relative aspect-[4/3] bg-ink-800">
              {p.image_url ? (
                <Image
                  src={p.image_url}
                  alt={p.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center text-3xl">📦</div>
              )}
              <div className="absolute left-2 top-2">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded border-2 text-xs font-bold ${
                    selected.has(i)
                      ? "border-trail-500 bg-trail-500 text-ink-950"
                      : "border-ink-500 bg-ink-900/80"
                  }`}
                >
                  {selected.has(i) ? "✓" : ""}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 p-3">
              <p className="text-sm font-medium text-bone line-clamp-2">{p.name}</p>
              {p.price !== null && (
                <p className="font-display text-lg text-trail-400">{fmtMxn(p.price)}</p>
              )}
              {/* Selector de categoría */}
              <select
                value={categories[i] ?? p.category ?? "otros"}
                onChange={(e) => {
                  e.stopPropagation();
                  setCategories((prev) => ({ ...prev, [i]: e.target.value }));
                }}
                onClick={(e) => e.stopPropagation()}
                className="input-field text-xs py-1.5"
              >
                {MARKETPLACE_CATEGORIES.filter((c) => c.id !== "todos").map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Acciones */}
      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
        <button onClick={reset} className="btn-ghost">
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={loading || selected.size === 0}
          className="btn-primary disabled:opacity-50"
        >
          {loading
            ? "Guardando…"
            : `Guardar ${selected.size} producto${selected.size !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}
