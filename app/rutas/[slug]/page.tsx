import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RouteMap } from "@/components/RouteMap";
import { RouteReviews } from "@/components/RouteReviews";
import { Reveal } from "@/components/Reveal";
import { events, levelMeta } from "@/lib/data";
import { getRouteBySlug } from "@/lib/routes-data";
import { formatEventDate, formatEventTime } from "@/lib/date";
import { providers, TYPE_META } from "@/lib/providers";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const trail = await getRouteBySlug(slug);
  if (!trail) return { title: "Ruta no encontrada" };
  return {
    title: `${trail.name} — ${trail.state}`,
    description: trail.blurb ?? undefined,
    openGraph: trail.image ? { images: [trail.image] } : undefined,
  };
}

export default async function RouteDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const trail = await getRouteBySlug(slug);
  if (!trail) notFound();

  const meta = levelMeta[trail.level];
  const paragraphs = (trail.description ?? "").split(/\n\n+/).filter(Boolean);
  const coords = trail.startCoords ?? { lat: 23.6, lng: -102.5 };
  const routeEvents = events.filter((e) => e.routeSlug === trail.slug);
  const nearbyProviders = providers
    .filter((p) => p.state === trail.state)
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 2);

  return (
    <>
      <Navbar />
      <main>
        {/* Cover */}
        <section className="relative h-[64svh] min-h-[460px] w-full overflow-hidden">
          {trail.image ? (
            <Image
              src={trail.image}
              alt={`${trail.name} — ${trail.region ?? ""}, ${trail.state}`}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div className="topo h-full w-full bg-gradient-to-br from-ink-800 to-ink-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/50 to-ink-950/30" />
          <div className="absolute inset-x-0 bottom-0">
            <div className="shell pb-10">
              <Link
                href="/rutas"
                className="link-underline mb-6 inline-flex items-center gap-2 text-sm font-medium text-mute hover:text-bone"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M19 12H5m0 0l6 6m-6-6l6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Todas las rutas
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${meta.className}`}>
                  {meta.label}
                </span>
                {trail.terrain.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-ink-600 bg-ink-950/60 px-3 py-1 text-xs font-medium text-mute backdrop-blur-sm"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-trail-400">
                {trail.region} · {trail.state}
              </p>
              <h1 className="mt-1 font-display text-6xl tracking-tightest text-bone sm:text-8xl">
                {trail.name}
              </h1>
            </div>
          </div>
        </section>

        {/* Specs bar */}
        <section className="border-b border-ink-700 bg-ink-900/40">
          <div className="shell grid grid-cols-2 gap-px py-2 sm:grid-cols-4">
            <Spec label="Distancia" value={`${trail.distanceKm} km`} />
            <Spec label="Desnivel" value={`${trail.elevationM} m`} />
            <Spec label="Duración" value={trail.duration ?? "—"} />
            <Spec label="Mejor temporada" value={trail.bestSeason ?? "—"} />
          </div>
        </section>

        {/* Body */}
        <section className="shell grid gap-12 py-16 lg:grid-cols-[1.4fr_0.9fr]">
          {/* Main column */}
          <div>
            <Reveal>
              <h2 className="font-display text-4xl text-bone">La ruta</h2>
              <div className="mt-5 space-y-4 text-[1.05rem] leading-relaxed text-mute">
                {paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </Reveal>

            {/* Gallery */}
            <Reveal className="mt-12">
              <h2 className="font-display text-4xl text-bone">Galería</h2>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {trail.gallery.map((src, i) => (
                  <div
                    key={i}
                    className={`relative overflow-hidden rounded-xl2 border border-ink-700 ${
                      i === 0 ? "col-span-2 aspect-[16/10] sm:col-span-2 sm:row-span-2" : "aspect-square"
                    }`}
                  >
                    <Image
                      src={src}
                      alt={`${trail.name} — imagen ${i + 1}`}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </Reveal>

            {/* Gear */}
            <Reveal className="mt-12">
              <h2 className="font-display text-4xl text-bone">Equipo recomendado</h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {trail.gear.map((g) => (
                  <li key={g} className="flex items-start gap-3 text-mute">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-trail-500/15 text-trail-400">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {g}
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* Reseñas */}
            <Reveal className="mt-12">
              <RouteReviews trailSlug={slug} />
            </Reveal>
          </div>

          {/* Sticky aside */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            {/* Map */}
            <div className="h-72 w-full">
              <RouteMap coords={coords} track={trail.track} name={trail.name} />
            </div>
            <Link
              href={`/rutas/${slug}/navegar`}
              className="btn-primary mt-3 w-full"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
              </svg>
              Navegar esta ruta
            </Link>

            {/* Next dates */}
            <div className="card-line mt-5 p-6">
              <h3 className="font-display text-2xl text-bone">Próximas fechas</h3>
              {routeEvents.length > 0 ? (
                <ul className="mt-4 space-y-4">
                  {routeEvents.map((ev) => {
                    const d = formatEventDate(ev.date);
                    return (
                      <li key={ev.id} className="flex items-center gap-4">
                        <div className="flex flex-col items-center rounded-xl border border-ink-700 bg-ink-950 px-3 py-1.5">
                          <span className="font-display text-2xl leading-none text-trail-500">{d.day}</span>
                          <span className="text-[0.65rem] font-semibold uppercase text-mute">{d.month}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-bone">{ev.tag}</p>
                          <p className="text-xs text-mute">
                            {d.weekday} · {formatEventTime(ev.date)} · {ev.spotsLeft} lugares
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-mute">
                  Aún no hay fechas abiertas para esta ruta. Únete y te avisamos en cuanto se programe.
                </p>
              )}
              <Link href="/#join" className="btn-primary mt-6 w-full">
                Únete a una salida
              </Link>
            </div>

            {/* Nearby providers */}
            <div className="card-line mt-5 p-6">
              <h3 className="font-display text-2xl text-bone">Proveedores en la zona</h3>
              {nearbyProviders.length > 0 ? (
                <ul className="mt-4 space-y-4">
                  {nearbyProviders.map((p) => {
                    const pmeta = TYPE_META[p.type];
                    return (
                      <li key={p.id} className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-800 text-sm font-display text-trail-500">
                          {p.name.split(" ").slice(0,2).map(w => w[0]).join("")}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-bone">{p.name}</p>
                          <span className={`inline-block rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold ${pmeta.className}`}>
                            {pmeta.label}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-mute">
                  No hay proveedores registrados en {trail.state} aún.
                </p>
              )}
              <Link
                href={`/proveedores?estado=${encodeURIComponent(trail.state)}`}
                className="btn-ghost mt-5 w-full"
              >
                Ver todos en {trail.state}
              </Link>
            </div>
          </aside>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-transparent px-2 py-4">
      <dt className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-mute">{label}</dt>
      <dd className="mt-1 font-display text-2xl text-bone">{value}</dd>
    </div>
  );
}
