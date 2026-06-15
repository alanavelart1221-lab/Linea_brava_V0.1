import { redirect } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending: { label: "En revisión", className: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400" },
  approved: { label: "Publicada", className: "border-go-500/40 bg-go-500/10 text-go-400" },
  rejected: { label: "Rechazada", className: "border-red-500/40 bg-red-500/10 text-red-400" },
};

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/?login=1");

  const { data: routes } = await supabase
    .from("user_routes")
    .select("id, name, state, level, distance_km, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const avatar = user.user_metadata?.avatar_url as string | undefined;
  const fullName = user.user_metadata?.full_name as string | undefined;

  return (
    <>
      <Navbar />
      <main className="shell pt-28 pb-20">
        {/* Profile header */}
        <div className="flex flex-col items-start gap-6 border-b border-ink-700 pb-8 sm:flex-row sm:items-center">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt={fullName ?? "Avatar"}
              className="h-20 w-20 rounded-full border-2 border-trail-500/40"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-trail-500 text-3xl font-bold text-ink-950">
              {fullName?.[0]?.toUpperCase() ?? "U"}
            </div>
          )}
          <div>
            <h1 className="font-display text-4xl text-bone">{fullName ?? "Mi perfil"}</h1>
            <p className="mt-1 text-sm text-mute">{user.email}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/mis-rutas/grabar" className="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="3" fill="currentColor" />
              <path d="M12 2v3m0 14v3M2 12h3m14 0h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Grabar nueva ruta
          </Link>
          <Link href="/rutas" className="btn-ghost">
            Explorar rutas
          </Link>
        </div>

        {/* Routes list */}
        <section className="mt-10">
          <h2 className="font-display text-3xl text-bone">Mis rutas</h2>

          {!routes || routes.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-ink-600 bg-ink-900/40 p-10 text-center">
              <p className="text-mute">Todavía no has grabado ninguna ruta.</p>
              <Link href="/mis-rutas/grabar" className="btn-primary mt-4 inline-flex">
                Grabar mi primera ruta
              </Link>
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {routes.map((r) => {
                const st = STATUS_LABEL[r.status] ?? STATUS_LABEL.pending;
                return (
                  <li
                    key={r.id}
                    className="card-line flex items-center justify-between gap-4 p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-bone">{r.name}</p>
                      <p className="mt-0.5 text-xs text-mute">
                        {r.state} · {r.level} · {r.distance_km ? `${r.distance_km} km` : "—"}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${st.className}`}>
                      {st.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
