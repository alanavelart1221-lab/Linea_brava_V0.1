import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import type { ProviderPromotion } from "@/lib/providers";
import { fmtFechaCorta } from "@/lib/providers";
import { QuoteForm } from "@/app/proveedores/[id]/QuoteForm";
import { TrackView } from "@/app/proveedores/[id]/TrackView";
import { ContactoTracker } from "@/app/proveedores/[id]/ContactoTracker";

export const dynamic = "force-dynamic";

type TallerRow = {
  id: string;
  name: string;
  state: string;
  city: string;
  description: string;
  specialty: string[] | null;
  servicios: string[] | null;
  phone: string;
  whatsapp: string | null;
  website: string | null;
  address: string | null;
  horario: string | null;
  lat: number | null;
  lng: number | null;
  verificado: boolean;
  logo_url: string | null;
  gallery: string[] | null;
  social: { facebook?: string; instagram?: string; tiktok?: string; youtube?: string } | null;
};

export default async function TallerDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: taller } = await supabase
    .from("providers")
    .select(
      "id, name, state, city, description, specialty, servicios, phone, whatsapp, website, address, horario, lat, lng, verificado, logo_url, gallery, social"
    )
    .eq("id", id)
    .eq("type", "taller")
    .single<TallerRow>();

  if (!taller) notFound();

  const { data: promosData } = await supabase
    .from("provider_promotions")
    .select(
      "id, provider_id, titulo, descripcion, descuento, fecha_inicio, fecha_fin, activo, created_at"
    )
    .eq("provider_id", id)
    .order("created_at", { ascending: false });

  const promociones = (promosData as ProviderPromotion[] | null) ?? [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const defaultNombre =
    (user?.user_metadata?.full_name as string) ??
    user?.email?.split("@")[0] ??
    "";
  const defaultContacto = user?.email ?? "";

  const especialidades = taller.specialty ?? [];
  const servicios = taller.servicios ?? [];
  const galeria = taller.gallery ?? [];
  const fotos = taller.logo_url
    ? [taller.logo_url, ...galeria].slice(0, 6)
    : galeria.slice(0, 6);

  const mapsQuery = taller.address
    ? `${taller.address}, ${taller.city}, ${taller.state}`
    : `${taller.name} ${taller.city} ${taller.state}`;

  return (
    <>
      <Navbar />
      <TrackView providerId={taller.id} />
      <main className="shell pt-28 pb-20">
        <Link href="/talleres" className="link-underline text-sm text-mute hover:text-bone">
          ← Volver a Talleres
        </Link>

        {/* Encabezado */}
        <section className="mt-6 card-line p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {taller.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={taller.logo_url}
                    alt={taller.name}
                    className="h-12 w-12 shrink-0 rounded-xl object-cover"
                  />
                )}
                <h1 className="font-display text-4xl text-bone">{taller.name}</h1>
                {taller.verificado && (
                  <span className="flex items-center gap-1 rounded-full border border-go-500/40 bg-go-500/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-go-400">
                    <svg viewBox="0 0 16 16" className="h-3 w-3 fill-current">
                      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.03 5.03a.75.75 0 10-1.06-1.06L7 7.94 5.53 6.47a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l3.5-3.5z" />
                    </svg>
                    Verificado
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-3 text-sm text-mute">
                {(taller.address || taller.city) && (
                  <span className="flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                    {taller.address
                      ? `${taller.address}, ${taller.city}, ${taller.state}`
                      : `${taller.city}, ${taller.state}`}
                  </span>
                )}
                {taller.horario && (
                  <span className="flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {taller.horario}
                  </span>
                )}
              </div>

              <p className="mt-5 max-w-2xl text-mute">{taller.description}</p>

              {especialidades.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {especialidades.map((s) => (
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

            <ContactoTracker
              providerId={taller.id}
              phone={taller.phone}
              website={taller.website}
            />
          </div>
        </section>

        {/* Galería */}
        {fotos.length > 0 && (
          <section className="mt-12">
            <h2 className="h3 mb-6 text-bone">Galería</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {fotos.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt={`${taller.name} foto ${i + 1}`}
                  className="aspect-video w-full rounded-xl object-cover"
                />
              ))}
            </div>
          </section>
        )}

        {/* Servicios */}
        {servicios.length > 0 && (
          <section className="mt-12">
            <h2 className="h3 mb-6 text-bone">Servicios</h2>
            <div className="flex flex-wrap gap-2">
              {servicios.map((s) => (
                <span
                  key={s}
                  className="flex items-center gap-1.5 rounded-full border border-ink-600 bg-ink-900 px-3 py-1.5 text-sm text-mute"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-go-500" />
                  {s}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Ubicación en mapa */}
        {(taller.lat != null && taller.lng != null) || taller.address ? (
          <section className="mt-12">
            <h2 className="h3 mb-6 text-bone">Ubicación</h2>
            <div className="overflow-hidden rounded-2xl border border-ink-700">
              {taller.lat != null && taller.lng != null ? (
                <iframe
                  title={`Mapa ${taller.name}`}
                  width="100%"
                  height="360"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${taller.lat},${taller.lng}&z=15&output=embed`}
                  className="w-full"
                />
              ) : (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-ink-900 py-12 text-sm text-trail-400 hover:text-trail-300"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  Ver en Google Maps: {mapsQuery}
                </a>
              )}
            </div>
          </section>
        ) : null}

        {/* Redes sociales */}
        {taller.social && Object.values(taller.social).some(Boolean) && (
          <section className="mt-12">
            <h2 className="h3 mb-6 text-bone">Redes</h2>
            <div className="flex flex-wrap gap-3">
              {taller.social.facebook && (
                <a href={taller.social.facebook} target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm">Facebook</a>
              )}
              {taller.social.instagram && (
                <a href={taller.social.instagram} target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm">Instagram</a>
              )}
              {taller.social.tiktok && (
                <a href={taller.social.tiktok} target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm">TikTok</a>
              )}
              {taller.social.youtube && (
                <a href={taller.social.youtube} target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm">YouTube</a>
              )}
            </div>
          </section>
        )}

        {/* Promociones */}
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

        {/* Cotización */}
        <section id="cotizar" className="mt-12 max-w-xl scroll-mt-28">
          <QuoteForm
            providerId={taller.id}
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
