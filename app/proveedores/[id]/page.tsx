import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { TYPE_META, fmtFechaCorta } from "@/lib/providers";
import type {
  ProviderType,
  ProviderProduct,
  ProviderService,
  ProviderPromotion,
} from "@/lib/providers";
import { QuoteForm } from "./QuoteForm";
import { TrackView } from "./TrackView";
import { ContactoTracker } from "./ContactoTracker";

export const dynamic = "force-dynamic";

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

  const { data: servicesData } = await supabase
    .from("provider_services")
    .select("id, provider_id, name, description, price, currency, created_at")
    .eq("provider_id", id)
    .order("created_at", { ascending: false });

  const services = (servicesData as ProviderService[] | null) ?? [];

  // La RLS solo devuelve al público las promociones activas y vigentes.
  const { data: promosData } = await supabase
    .from("provider_promotions")
    .select("id, provider_id, titulo, descripcion, descuento, fecha_inicio, fecha_fin, activo, created_at")
    .eq("provider_id", id)
    .order("created_at", { ascending: false });

  const promociones = (promosData as ProviderPromotion[] | null) ?? [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const defaultNombre =
    (user?.user_metadata?.full_name as string) ?? user?.email?.split("@")[0] ?? "";
  const defaultContacto = user?.email ?? "";

  const meta = TYPE_META[provider.type as ProviderType];

  return (
    <>
      <Navbar />
      <TrackView providerId={provider.id} />
      <main className="shell pt-28 pb-20">
        <Link
          href="/marketplace"
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
            <ContactoTracker
              providerId={provider.id}
              phone={provider.phone}
              website={provider.website}
            />
          </div>
        </section>

        {/* Promociones vigentes */}
        {promociones.length > 0 && (
          <section className="mt-12">
            <h2 className="h3 mb-6 text-bone">Promociones</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {promociones.map((p) => (
                <li key={p.id} className="card-line p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-bone">{p.titulo}</p>
                    {p.descuento && (
                      <span className="rounded-full border border-trail-500/40 bg-trail-500/10 px-2 py-0.5 text-xs font-semibold text-trail-400">
                        {p.descuento}
                      </span>
                    )}
                  </div>
                  {p.descripcion && (
                    <p className="mt-1.5 text-sm text-mute">{p.descripcion}</p>
                  )}
                  {p.fecha_fin && (
                    <p className="mt-1 text-xs text-mute/60">
                      Vigente hasta {fmtFechaCorta(p.fecha_fin)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Servicios */}
        {services.length > 0 && (
          <section className="mt-12">
            <h2 className="h3 mb-6 text-bone">Servicios</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {services.map((s) => (
                <li key={s.id} className="card-line p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-bone">{s.name}</p>
                    {s.price != null && (
                      <p className="shrink-0 text-sm text-trail-500">
                        ${s.price.toLocaleString("es-MX")} {s.currency}
                      </p>
                    )}
                  </div>
                  {s.description && (
                    <p className="mt-1.5 text-sm text-mute">{s.description}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

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

        {/* Cotización */}
        <section id="cotizar" className="mt-12 max-w-xl scroll-mt-28">
          <QuoteForm
            providerId={provider.id}
            isLoggedIn={!!user}
            defaultNombre={defaultNombre}
            defaultContacto={defaultContacto}
          />
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
