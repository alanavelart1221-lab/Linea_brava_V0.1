import { redirect } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { AdminActions } from "./AdminActions";

export default async function AdminRutasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  // Check admin flag
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/");

  const { data: pending } = await supabase
    .from("user_routes")
    .select("id, name, state, region, level, distance_km, description, status, created_at, user_id")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (
    <>
      <Navbar />
      <main className="shell pt-28 pb-20">
        <div className="mb-8">
          <span className="eyebrow">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-trail-500" />
            Panel de administración
          </span>
          <h1 className="mt-3 font-display text-5xl text-bone">
            Rutas en revisión
          </h1>
        </div>

        {!pending || pending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-600 bg-ink-900/40 p-14 text-center">
            <p className="text-lg text-mute">No hay rutas pendientes de revisión.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {pending.map((route) => (
              <li key={route.id} className="card-line p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-2xl text-bone">{route.name}</h2>
                      <span className="rounded-full border border-yellow-500/40 bg-yellow-500/10 px-2.5 py-0.5 text-xs font-semibold text-yellow-400">
                        Pendiente
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-mute">
                      {route.region ? `${route.region} · ` : ""}{route.state} ·{" "}
                      {route.level} · {route.distance_km ? `${route.distance_km} km` : "—"}
                    </p>
                    {route.description && (
                      <p className="mt-3 max-w-2xl text-sm text-mute/80 line-clamp-3">
                        {route.description}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-mute/60">
                      Enviada el{" "}
                      {new Date(route.created_at).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <AdminActions routeId={route.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </>
  );
}
