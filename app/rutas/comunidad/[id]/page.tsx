import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RouteMap } from "@/components/RouteMap";
import { RouteReviews } from "@/components/RouteReviews";
import { Reveal } from "@/components/Reveal";
import { createClient } from "@/lib/supabase/server";
import { levelMeta, type TrailLevel } from "@/lib/data";
import type { Waypoint } from "@/lib/routes";

export const dynamic = "force-dynamic";

type RouteRow = {
  id: string;
  name: string;
  description: string | null;
  state: string;
  region: string | null;
  level: string;
  distance_km: number | null;
  elevation_m: number | null;
  track: [number, number][] | null;
  start_coords: { lat: number; lng: number } | null;
  waypoints: Waypoint[] | null;
  calificada: boolean;
  status: string;
};

export default async function ComunidadRutaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: route } = await supabase
    .from("user_routes")
    .select(
      "id, name, description, state, region, level, distance_km, elevation_m, track, start_coords, waypoints, calificada, status"
    )
    .eq("id", id)
    .single<RouteRow>();

  if (!route) notFound();

  const meta = levelMeta[(route.level as TrailLevel) ?? "Verde"] ?? levelMeta.Verde;
  const track = (route.track ?? []) as [number, number][];
  const coords = route.start_coords ?? (track[0] ? { lat: track[0][0], lng: track[0][1] } : null);

  return (
    <>
      <Navbar />
      <main className="shell pt-28 pb-20">
        <Link
          href="/rutas"
          className="link-underline inline-flex items-center gap-2 text-sm font-medium text-mute hover:text-bone"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M19 12H5m0 0l6 6m-6-6l6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Todas las rutas
        </Link>

        {/* Encabezado */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-ink-500 bg-ink-900 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-widest text-mute">
            Ruta de comunidad
          </span>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${meta.className}`}>
            {meta.label}
          </span>
          {route.calificada && (
            <span className="rounded-full border border-trail-500/50 bg-trail-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-trail-300">
              ★ Calificada
            </span>
          )}
          {route.status !== "approved" && (
            <span className="rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-400">
              No pública ({route.status})
            </span>
          )}
        </div>
        <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-trail-400">
          {route.region ? `${route.region} · ` : ""}{route.state}
        </p>
        <h1 className="mt-1 font-display text-5xl tracking-tightest text-bone sm:text-7xl">
          {route.name}
        </h1>

        {/* Specs */}
        <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl2 border border-ink-700 bg-ink-700 sm:grid-cols-4">
          <Spec label="Distancia" value={route.distance_km != null ? `${route.distance_km} km` : "—"} />
          <Spec label="Nivel" value={meta.short} />
          <Spec label="Desnivel" value={route.elevation_m != null ? `${route.elevation_m} m` : "—"} />
          <Spec label="Puntos GPS" value={String(track.length)} />
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1.4fr_0.9fr]">
          <div>
            {route.description && (
              <Reveal>
                <h2 className="font-display text-4xl text-bone">La ruta</h2>
                <p className="mt-5 whitespace-pre-wrap text-[1.05rem] leading-relaxed text-mute">
                  {route.description}
                </p>
              </Reveal>
            )}

            {/* Reseñas */}
            <Reveal className={route.description ? "mt-12" : ""}>
              <RouteReviews userRouteId={route.id} />
            </Reveal>
          </div>

          {/* Mapa */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="h-80 w-full">
              {coords && track.length > 0 ? (
                <RouteMap
                  coords={coords}
                  track={track}
                  name={route.name}
                  waypoints={route.waypoints ?? []}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-xl2 border border-ink-700 bg-ink-900 text-sm text-mute">
                  Sin trazo disponible
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink-950 px-4 py-4">
      <dt className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-mute">{label}</dt>
      <dd className="mt-1 font-display text-2xl text-bone">{value}</dd>
    </div>
  );
}
