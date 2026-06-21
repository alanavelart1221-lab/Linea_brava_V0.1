import Image from "next/image";
import Link from "next/link";
import { levelMeta } from "@/lib/data";
import type { RouteListItem } from "@/lib/routes";

export function CommunityRouteCard({ route }: { route: RouteListItem }) {
  const meta = levelMeta[route.level];
  return (
    <Link
      href={route.href}
      className="group relative flex flex-col overflow-hidden rounded-xl2 border border-ink-700 bg-ink-900 transition-colors duration-300 hover:border-trail-400/50 cursor-pointer"
    >
      <div className="topo relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-ink-800 to-ink-950">
        {route.image ? (
          <Image
            src={route.image}
            alt={`${route.name} — ${route.state}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
            className="object-cover transition-[filter,transform] duration-500 group-hover:scale-105 group-hover:brightness-110"
          />
        ) : (
          // Placeholder visual cuando la ruta de comunidad no tiene foto.
          <svg
            className="absolute inset-0 h-full w-full text-ink-600 opacity-40"
            viewBox="0 0 200 120"
            fill="none"
            aria-hidden="true"
            preserveAspectRatio="none"
          >
            <path
              d="M0 90 L40 60 L70 78 L110 38 L150 66 L200 30"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-sm ${meta.className}`}>
            {meta.label}
          </span>
          {route.calificada && (
            <span className="rounded-full border border-trail-500/50 bg-trail-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-trail-300 backdrop-blur-sm">
              ★ Calificada
            </span>
          )}
        </div>
        <span className="absolute right-3 top-3 rounded-full border border-ink-500 bg-ink-950/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-widest text-mute backdrop-blur-sm">
          Comunidad
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-trail-400">
          {route.region ? `${route.region} · ` : ""}{route.state}
        </p>
        <h3 className="mt-1 font-display text-3xl text-bone">{route.name}</h3>

        <dl className="mt-auto flex flex-wrap gap-x-6 gap-y-1 border-t border-ink-700 pt-4 text-sm">
          <div>
            <dt className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-mute">
              Distancia
            </dt>
            <dd className="mt-0.5 font-display text-lg text-bone">
              {route.distanceKm != null ? `${route.distanceKm} km` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-mute">
              Nivel
            </dt>
            <dd className="mt-0.5 font-display text-lg text-bone">{meta.short}</dd>
          </div>
        </dl>
      </div>
    </Link>
  );
}
