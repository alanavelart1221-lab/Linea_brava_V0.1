import { createClient } from "@/lib/supabase/server";
import { getApprovedRoutes } from "@/lib/routes-data";
import type { Stat } from "@/lib/data";

/** Stats reales del home: rutas, estados, miembros y reseñas. */
export async function getHomeStats(): Promise<Stat[]> {
  const supabase = await createClient();

  const [routes, memberRes, reviewsRes] = await Promise.all([
    getApprovedRoutes(),
    supabase.rpc("home_member_count"),
    supabase
      .from("route_reviews")
      .select("*", { count: "exact", head: true }),
  ]);

  const stateCount = new Set(routes.map((r) => r.state)).size;
  const memberCount = Number(memberRes.data ?? 0);
  const reviewCount = reviewsRes.count ?? 0;

  return [
    { value: routes.length, suffix: "", label: "Rutas en el directorio" },
    { value: stateCount, suffix: "", label: "Estados con rutas" },
    { value: memberCount, suffix: "", label: "Miembros activos" },
    { value: reviewCount, suffix: "", label: "Reseñas publicadas" },
  ];
}
