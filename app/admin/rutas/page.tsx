import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { requireAdmin } from "@/lib/auth";
import { reviewStats } from "@/lib/reviews";
import { AdminActions } from "./AdminActions";

export const dynamic = "force-dynamic";

type RouteRow = {
  id: string;
  name: string;
  state: string;
  region: string | null;
  level: string;
  distance_km: number | null;
  status: string;
  calificada: boolean;
  created_at: string;
};

export default async function AdminRutasPage() {
  const { supabase } = await requireAdmin();

  // Rutas de comunidad para moderar (públicas, ocultas y pendientes heredadas).
  const { data: routes } = await supabase
    .from("user_routes")
    .select("id, name, state, region, level, distance_km, status, calificada, created_at")
    .in("status", ["approved", "oculta", "pending"])
    .order("created_at", { ascending: false });

  const list = (routes as RouteRow[] | null) ?? [];

  // Promedio de estrellas por ruta.
  const ids = list.map((r) => r.id);
  const ratingByRoute = new Map<string, { average: number; count: number }>();
  if (ids.length > 0) {
    const { data: reviews } = await supabase
      .from("route_reviews")
      .select("user_route_id, rating")
      .in("user_route_id", ids);
    const grouped = new Map<string, { rating: number }[]>();
    for (const r of (reviews as { user_route_id: string; rating: number }[] | null) ?? []) {
      const arr = grouped.get(r.user_route_id) ?? [];
      arr.push({ rating: r.rating });
      grouped.set(r.user_route_id, arr);
    }
    for (const [routeId, rs] of grouped) ratingByRoute.set(routeId, reviewStats(rs));
  }

  return (
    <>
      <Navbar />
      <main className="shell pt-28 pb-20">
        <div className="mb-8">
          <span className="eyebrow">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-trail-500" />
            Panel de administración
          </span>
          <h1 className="mt-3 font-display text-5xl text-bone">Rutas de la comunidad</h1>
          <p className="mt-3 max-w-xl text-mute">
            Las rutas se publican solas. Aquí puedes destacar las mejores como «Calificada»
            (guíate por las estrellas) u ocultar las inapropiadas.
          </p>
        </div>

        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-600 bg-ink-900/40 p-14 text-center">
            <p className="text-lg text-mute">Aún no hay rutas de comunidad.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {list.map((route) => {
              const stats = ratingByRoute.get(route.id);
              const oculta = route.status === "oculta";
              return (
                <li key={route.id} className="card-line p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-2xl text-bone">{route.name}</h2>
                        {route.calificada && (
                          <span className="rounded-full border border-trail-500/50 bg-trail-500/15 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-trail-300">
                            ★ Calificada
                          </span>
                        )}
                        {oculta && (
                          <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-400">
                            Oculta
                          </span>
                        )}
                        {route.status === "pending" && (
                          <span className="rounded-full border border-yellow-500/40 bg-yellow-500/10 px-2.5 py-0.5 text-xs font-semibold text-yellow-400">
                            Pendiente (legado)
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-mute">
                        {route.region ? `${route.region} · ` : ""}{route.state} · {route.level} ·{" "}
                        {route.distance_km != null ? `${route.distance_km} km` : "—"}
                      </p>
                      <p className="mt-2 text-sm text-trail-400">
                        {stats && stats.count > 0
                          ? `★ ${stats.average.toFixed(1)} · ${stats.count} ${
                              stats.count === 1 ? "reseña" : "reseñas"
                            }`
                          : "Sin reseñas aún"}
                      </p>
                    </div>

                    <AdminActions routeId={route.id} calificada={route.calificada} oculta={oculta} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <Footer />
    </>
  );
}
