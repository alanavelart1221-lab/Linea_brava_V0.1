import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { requireAdmin } from "@/lib/auth";
import { TYPE_META } from "@/lib/providers";
import type { ProviderType } from "@/lib/providers";
import { SolicitudActions } from "./SolicitudActions";

type PendingProvider = {
  id: string;
  name: string;
  type: ProviderType;
  state: string;
  city: string;
  description: string;
  specialty: string[] | null;
  phone: string;
  website: string | null;
  created_at: string;
};

export default async function AdminProveedoresPage() {
  const { supabase } = await requireAdmin();

  const { data: pending } = await supabase
    .from("providers")
    .select("id, name, type, state, city, description, specialty, phone, website, created_at")
    .eq("status", "pendiente")
    .order("created_at", { ascending: true });

  const solicitudes = (pending as PendingProvider[] | null) ?? [];

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
            Solicitudes de proveedor
          </h1>
        </div>

        {solicitudes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-600 bg-ink-900/40 p-14 text-center">
            <p className="text-lg text-mute">No hay solicitudes pendientes.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {solicitudes.map((p) => {
              const meta = TYPE_META[p.type];
              return (
                <li key={p.id} className="card-line p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-2xl text-bone">{p.name}</h2>
                        {meta && (
                          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}>
                            {meta.label}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-mute">
                        {p.city}, {p.state} · {p.phone}
                        {p.website ? (
                          <>
                            {" · "}
                            <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-trail-400 hover:text-trail-300">
                              {p.website}
                            </a>
                          </>
                        ) : null}
                      </p>
                      <p className="mt-3 max-w-2xl text-sm text-mute/80">{p.description}</p>
                      {p.specialty && p.specialty.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {p.specialty.map((s) => (
                            <span key={s} className="rounded-full border border-ink-600 bg-ink-900 px-2.5 py-0.5 text-xs text-mute">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="mt-2 text-xs text-mute/60">
                        Solicitada el{" "}
                        {new Date(p.created_at).toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <SolicitudActions providerId={p.id} />
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
