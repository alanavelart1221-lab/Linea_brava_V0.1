import { createClient } from "@/lib/supabase/server";
import type { TrailLevel } from "@/lib/data";
import type { RouteFull, RouteListItem } from "@/lib/routes";

// Columnas que necesita la web para listar y para el detalle.
const SELECT =
  "id, slug, name, blurb, description, state, region, level, distance_km, elevation_m, duration, best_season, terrain, gear, gallery, image, track, start_coords, calificada, origen";

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? (v as unknown[]).filter((x) => typeof x === "string") as string[] : [];
}

function normalize(r: Record<string, unknown>): RouteFull {
  return {
    id: r.id as string,
    slug: (r.slug as string | null) ?? null,
    name: r.name as string,
    blurb: (r.blurb as string | null) ?? null,
    description: (r.description as string | null) ?? null,
    state: r.state as string,
    region: (r.region as string | null) ?? null,
    level: ((r.level as TrailLevel) ?? "Verde"),
    distanceKm: (r.distance_km as number | null) ?? null,
    elevationM: (r.elevation_m as number | null) ?? null,
    duration: (r.duration as string | null) ?? null,
    bestSeason: (r.best_season as string | null) ?? null,
    terrain: asStringArray(r.terrain),
    gear: asStringArray(r.gear),
    gallery: asStringArray(r.gallery),
    image: (r.image as string | null) ?? null,
    track: (Array.isArray(r.track) ? (r.track as [number, number][]) : []),
    startCoords: (r.start_coords as { lat: number; lng: number } | null) ?? null,
    calificada: Boolean(r.calificada),
    origen: (r.origen as "oficial" | "comunidad") ?? "comunidad",
  };
}

/** Convierte una ruta a la forma plana que consumen las tarjetas del listado. */
export function toListItem(r: RouteFull): RouteListItem {
  return {
    kind: r.origen,
    key: `${r.origen[0]}-${r.id}`,
    name: r.name,
    state: r.state,
    region: r.region,
    level: r.level,
    distanceKm: r.distanceKm,
    href: r.origen === "oficial" && r.slug ? `/rutas/${r.slug}` : `/rutas/comunidad/${r.id}`,
    blurb: r.blurb ?? undefined,
    image: r.image,
    calificada: r.calificada,
    elevationM: r.elevationM,
    duration: r.duration,
  };
}

/** Todas las rutas públicas (aprobadas). Calificadas primero. */
export async function getApprovedRoutes(): Promise<RouteFull[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_routes")
    .select(SELECT)
    .eq("status", "approved")
    .order("calificada", { ascending: false })
    .order("created_at", { ascending: false });
  return ((data as Record<string, unknown>[] | null) ?? []).map(normalize);
}

/** Una ruta oficial por slug (solo aprobadas). */
export async function getRouteBySlug(slug: string): Promise<RouteFull | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_routes")
    .select(SELECT)
    .eq("slug", slug)
    .eq("status", "approved")
    .maybeSingle();
  return data ? normalize(data as Record<string, unknown>) : null;
}

/** Conteos para el hero del home. */
export async function getRouteStats(): Promise<{ routeCount: number; stateCount: number }> {
  const routes = await getApprovedRoutes();
  return {
    routeCount: routes.length,
    stateCount: new Set(routes.map((r) => r.state)).size,
  };
}
