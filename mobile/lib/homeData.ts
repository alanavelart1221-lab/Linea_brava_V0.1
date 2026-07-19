import { supabase } from "./supabase";
import { fetchReviews, reviewStats } from "./reviews";
import type { Point } from "./geo";

export type FeaturedRoute = {
  id: string;
  name: string;
  level: string | null;
  distance_km: number | null;
  track: Point[] | null;
  ratingAverage: number;
  ratingCount: number;
};

export type HomeData = {
  routesCount: number | null;
  nextEvent: { title: string; daysAway: number } | null;
  productsCount: number | null;
  postsToday: number | null;
  lastActivityAt: string | null;
  featuredRoute: FeaturedRoute | null;
};

async function fetchRoutesCount(): Promise<number | null> {
  const { count, error } = await supabase
    .from("user_routes")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved");
  return error ? null : count;
}

async function fetchNextEvent(): Promise<HomeData["nextEvent"]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("user_events")
    .select("title, date")
    .eq("status", "approved")
    .gte("date", today)
    .order("date", { ascending: true })
    .limit(1);
  const ev = data?.[0];
  if (error || !ev) return null;
  const msPerDay = 86400000;
  const daysAway = Math.max(
    0,
    Math.round((new Date(ev.date).getTime() - Date.now()) / msPerDay)
  );
  return { title: ev.title, daysAway };
}

async function fetchProductsCount(): Promise<number | null> {
  const { count, error } = await supabase
    .from("provider_products")
    .select("id, providers!inner(estado)", { count: "exact", head: true })
    .eq("active", true)
    .in("providers.estado", ["en_prueba", "activo"]);
  return error ? null : count;
}

async function fetchPostsToday(): Promise<number | null> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from("forum_threads")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfDay.toISOString());
  return error ? null : count;
}

async function fetchLastActivityAt(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("user_activities")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) return null;
  return data?.[0]?.created_at ?? null;
}

async function fetchFeaturedRoute(): Promise<FeaturedRoute | null> {
  const { data, error } = await supabase
    .from("user_routes")
    .select("id, name, level, distance_km, track")
    .eq("status", "approved")
    .order("calificada", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1);
  const row = data?.[0];
  if (error || !row) return null;
  const stats = reviewStats(await fetchReviews(row.id));
  return {
    id: row.id,
    name: row.name,
    level: row.level ?? null,
    distance_km: row.distance_km ?? null,
    track: (row.track as Point[] | null) ?? null,
    ratingAverage: stats.average,
    ratingCount: stats.count,
  };
}

/** Carga todos los datos del Inicio en paralelo; cada bloque tolera fallos. */
export async function loadHomeData(userId?: string): Promise<HomeData> {
  const [routesCount, nextEvent, productsCount, postsToday, lastActivityAt, featuredRoute] =
    await Promise.all([
      fetchRoutesCount().catch(() => null),
      fetchNextEvent().catch(() => null),
      fetchProductsCount().catch(() => null),
      fetchPostsToday().catch(() => null),
      userId ? fetchLastActivityAt(userId).catch(() => null) : Promise.resolve(null),
      fetchFeaturedRoute().catch(() => null),
    ]);
  return { routesCount, nextEvent, productsCount, postsToday, lastActivityAt, featuredRoute };
}
