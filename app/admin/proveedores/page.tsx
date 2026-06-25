import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { requireAdmin } from "@/lib/auth";
import {
  ESTADO_META,
  TYPE_META,
  fmtFechaCorta,
  type ProviderEstado,
  type ProviderType,
} from "@/lib/providers";
import { SolicitudActions } from "./SolicitudActions";

export const dynamic = "force-dynamic";

type AdminProvider = {
  id: string;
  name: string;
  type: ProviderType;
  estado: ProviderEstado;
  state: string;
  city: string;
  address: string | null;
  description: string;
  specialty: string[] | null;
  servicios: string[] | null;
  marcas: string[] | null;
  phone: string;
  email: string | null;
  whatsapp: string | null;
  website: string | null;
  trial_start: string | null;
  trial_end: string | null;
  rejected_reason: string | null;
  info_requested: string | null;
  created_at: string;
};

const FILTROS: { id: ProviderEstado | "todos"; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "pendiente", label: "Pendientes" },
  { id: "info_pendiente", label: "Info pendiente" },
  { id: "en_prueba", label: "En prueba" },
  { id: "activo", label: "Activos" },
  { id: "suspendido", label: "Suspendidos" },
  { id: "rechazado", label: "Rechazados" },
];

const SELECT =
  "id, name, type, estado, state, city, address, description, specialty, servicios, marcas, phone, email, whatsapp, website, trial_start, trial_end, rejected_reason, info_requested, created_at";

export default async function AdminProveedoresPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado: estadoRaw } = await searchParams;
  const filtro = FILTROS.some((f) => f.id === estadoRaw) ? estadoRaw! : "todos";

  const { supabase } = await requireAdmin();

  let query = supabase.from("providers").select(SELECT);
  if (filtro !== "todos") query = query.eq("estado", filtro);
  const { data } = await query.order("created_at", { ascending: false });
  const solicitudes = (data as AdminProvider[] | null) ?? [];

  // Estado de suscripción por proveedor.
  const ids = solicitudes.map((s) => s.id);
  const subMap = new Map<string, string>();
  if (ids.length > 0) {
    const { data: subs } = await supabase
      .from("provider_subscriptions")
      .select("provider_id, status")
      .in("provider_id", ids);
    (subs as { provider_id: string; status: string }[] | null)?.forEach((s) =>
      subMap.set(s.provider_id, s.status)
    );
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
          <h1 className="mt-3 font-display text-5xl text-bone">
            Administración de proveedores
          </h1>
        </div>

        {/* Filtros por estado */}
        <div className="mb-8 flex flex-wrap gap-2">
          {FILTROS.map((f) => {
            const active = f.id === filtro;
            return (
              <Link
                key={f.id}
                href={f.id === "todos" ? "/admin/proveedores" : `/admin/proveedores?estado=${f.id}`}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                  active
                    ? "border-trail-500 bg-trail-500 text-ink-950"
                    : "border-ink-600 text-mute hover:border-ink-400 hover:text-bone"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>

        {solicitudes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-600 bg-ink-900/40 p-14 text-center">
            <p className="text-lg text-mute">No hay proveedores en este filtro.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {solicitudes.map((p) => {
              const meta = TYPE_META[p.type];
              const estadoMeta = ESTADO_META[p.estado];
              const subStatus = subMap.get(p.id);
              return (
                <li key={p.id} className="card-line p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-2xl text-bone">{p.name}</h2>
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${estadoMeta.className}`}>
                          {estadoMeta.label}
                        </span>
                        {meta && (
                          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}>
                            {meta.label}
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm text-mute">
                        {p.city}, {p.state}
                        {p.address ? ` · ${p.address}` : ""}
                      </p>
                      <p className="mt-1 text-sm text-mute">
                        Tel: {p.phone}
                        {p.whatsapp ? ` · WhatsApp: ${p.whatsapp}` : ""}
                        {p.email ? ` · ${p.email}` : ""}
                        {p.website ? (
                          <>
                            {" · "}
                            <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-trail-400 hover:text-trail-300">
                              sitio web
                            </a>
                          </>
                        ) : null}
                      </p>

                      <p className="mt-3 max-w-2xl text-sm text-mute/80">{p.description}</p>

                      <Tags label="Especialidades" items={p.specialty} />
                      <Tags label="Servicios" items={p.servicios} />
                      <Tags label="Marcas" items={p.marcas} />

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-mute/60">
                        <span>
                          Solicitada el {fmtFechaCorta(p.created_at)}
                        </span>
                        {p.trial_start && (
                          <span>
                            Prueba: {fmtFechaCorta(p.trial_start)} → {fmtFechaCorta(p.trial_end)}
                          </span>
                        )}
                        {subStatus && <span>Suscripción: {subStatus}</span>}
                      </div>

                      {p.estado === "info_pendiente" && p.info_requested && (
                        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                          Info solicitada: {p.info_requested}
                        </p>
                      )}
                      {p.estado === "rechazado" && p.rejected_reason && (
                        <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                          Motivo del rechazo: {p.rejected_reason}
                        </p>
                      )}
                    </div>

                    <SolicitudActions providerId={p.id} estado={p.estado} />
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

function Tags({ label, items }: { label: string; items: string[] | null }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-semibold text-mute/60">{label}:</span>
      {items.map((s) => (
        <span key={s} className="rounded-full border border-ink-600 bg-ink-900 px-2.5 py-0.5 text-xs text-mute">
          {s}
        </span>
      ))}
    </div>
  );
}
