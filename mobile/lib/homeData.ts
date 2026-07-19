import { supabase } from "./supabase";

export type HomeData = {
  routesCount: number | null;
  nextEvent: { title: string; daysAway: number } | null;
  productsCount: number | null;
  talleresCount: number | null;
  postsToday: number | null;
  lastActivityAt: string | null;
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

async function fetchTalleresCount(): Promise<number | null> {
  const { count, error } = await supabase
    .from("providers")
    .select("id", { count: "exact", head: true })
    .eq("type", "taller")
    .in("estado", ["en_prueba", "activo"]);
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

/** Carga todos los datos del Inicio en paralelo; cada bloque tolera fallos. */
export async function loadHomeData(userId?: string): Promise<HomeData> {
  const [routesCount, nextEvent, productsCount, talleresCount, postsToday, lastActivityAt] =
    await Promise.all([
      fetchRoutesCount().catch(() => null),
      fetchNextEvent().catch(() => null),
      fetchProductsCount().catch(() => null),
      fetchTalleresCount().catch(() => null),
      fetchPostsToday().catch(() => null),
      userId ? fetchLastActivityAt(userId).catch(() => null) : Promise.resolve(null),
    ]);
  return { routesCount, nextEvent, productsCount, talleresCount, postsToday, lastActivityAt };
}
