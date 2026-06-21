import Image from "next/image";
import Link from "next/link";
import { levelMeta } from "@/lib/data";
import type { RouteListItem } from "@/lib/routes";

export function RouteCard({ route, priority = false }: { route: RouteListItem; priority?: boolean }) {
  const meta = levelMeta[route.level];
  return (
    <Link
      href={route.href}
      className="group relative flex flex-col overflow-hidden rounded-xl2 border border-ink-700 bg-ink-900 transition-colors duration-300 hover:border-trail-400/50 cursor-pointer"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {route.image ? (
          <Image
            src={route.image}
            alt={`${route.name} — ${route.state}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
            priority={priority}
            className="object-cover transition-[filter,transform] duration-500 group-hover:scale-105 group-hover:brightness-110"
          />
        ) : (
          <div className="topo h-full w-full bg-gradient-to-br from-ink-800 to-ink-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/10 to-transparent" />
        <span
          className={`absolute left-3 top-3 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-sm ${meta.className}`}
        >
          {meta.label}
        </span>
        {route.calificada && (
          <span className="absolute right-3 top-3 rounded-full border border-trail-500/50 bg-trail-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-trail-300 backdrop-blur-sm">
            ★ Calificada
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-trail-400">
          {route.region ? `${route.region} · ` : ""}{route.state}
        </p>
        <h3 className="mt-1 font-display text-3xl text-bone">{route.name}</h3>
        {route.blurb ? (
          <p className="mt-2 line-clamp-2 flex-1 text-sm text-mute">{route.blurb}</p>
        ) : (
          <div className="flex-1" />
        )}

        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-ink-700 pt-4 text-sm">
          <Spec label="Distancia" value={route.distanceKm != null ? `${route.distanceKm} km` : "—"} />
          {route.elevationM != null && <Spec label="Desnivel" value={`${route.elevationM} m`} />}
          {route.duration && <Spec label="Duración" value={route.duration} />}
        </dl>
      </div>
    </Link>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-mute">
        {label}
      </dt>
      <dd className="mt-0.5 font-display text-lg text-bone">{value}</dd>
    </div>
  );
}
