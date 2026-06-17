import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { TYPE_META } from "@/lib/providers";
import type { ProviderType, ProviderProduct } from "@/lib/providers";

export const revalidate = 60;

type ProviderRow = {
  id: string;
  name: string;
  type: string;
  state: string;
  city: string;
  description: string;
  specialty: string[] | null;
  phone: string;
  website: string | null;
  featured: boolean;
};

export default async function ProveedorDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS deja ver al público solo proveedores aprobados (y al dueño/admin el suyo).
  const { data: provider } = await supabase
    .from("providers")
    .select("id, name, type, state, city, description, specialty, phone, website, featured")
    .eq("id", id)
    .single<ProviderRow>();

  if (!provider) notFound();

  const { data: productsData } = await supabase
    .from("provider_products")
    .select("id, provider_id, name, description, price, currency, image_url, created_at")
    .eq("provider_id", id)
    .order("created_at", { ascending: false });

  const products = (productsData as ProviderProduct[] | null) ?? [];
  const meta = TYPE_META[provider.type as ProviderType];

  return (
    <>
      <Navbar />
      <main className="shell pt-28 pb-20">
        <Link
          href="/proveedores"
          className="link-underline text-sm text-mute hover:text-bone"
        >
          ← Volver al directorio
        </Link>

        {/* Encabezado / contacto */}
        <section className="mt-6 card-line p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-4xl text-bone">{provider.name}</h1>
                {provider.featured && (
                  <span className="rounded-full border border-trail-500/40 bg-trail-500/10 px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest text-trail-400">
                    Destacado
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {meta && (
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}>
                    {meta.label}
                  </span>
                )}
                <span className="text-sm text-mute">
                  {provider.city}, {provider.state}
                </span>
              </div>
              <p className="mt-5 max-w-2xl text-mute">{provider.description}</p>

              {provider.specialty && provider.specialty.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {provider.specialty.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-ink-600 bg-ink-900 px-2.5 py-0.5 text-xs text-mute"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Contacto para cotización */}
            <div className="flex w-full shrink-0 flex-col gap-3 sm:w-64">
              <a
                href={`tel:${provider.phone}`}
                className="rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-center text-sm font-medium text-bone transition-colors hover:border-trail-500/50 hover:text-trail-400"
              >
                {provider.phone}
              </a>
              {provider.website && (
                <a
                  href={provider.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-center text-sm font-medium text-bone transition-colors hover:border-trail-500/50 hover:text-trail-400"
                >
                  Sitio web
                </a>
              )}
              <a
                href={`mailto:contacto@lineabrava.mx?subject=Cotización: ${encodeURIComponent(provider.name)}`}
                className="btn-primary text-center"
              >
                Solicitar cotización
              </a>
            </div>
          </div>
        </section>

        {/* Tienda / Accesorios */}
        <section className="mt-12">
          <div className="mb-6 flex items-center gap-3">
            <h2 className="h3 text-bone">Tienda / Accesorios</h2>
            <span className="text-sm text-mute">
              {products.length} producto{products.length !== 1 ? "s" : ""}
            </span>
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink-600 bg-ink-900/40 p-14 text-center">
              <p className="text-mute">
                Este proveedor aún no ha publicado productos o accesorios.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

function ProductCard({ product }: { product: ProviderProduct }) {
  return (
    <article className="card-line flex flex-col overflow-hidden">
      {product.image_url ? (
        <div className="aspect-[4/3] w-full bg-ink-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-ink-800 text-mute/40">
          Sin imagen
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-lg text-bone">{product.name}</h3>
        {product.description && (
          <p className="text-sm text-mute line-clamp-3">{product.description}</p>
        )}
        {product.price != null && (
          <p className="mt-auto pt-2 font-display text-xl text-trail-500">
            ${product.price.toLocaleString("es-MX")} {product.currency}
          </p>
        )}
      </div>
    </article>
  );
}
