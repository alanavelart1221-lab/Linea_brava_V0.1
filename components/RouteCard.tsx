import Image from "next/image";
import Link from "next/link";
import { type Trail, levelMeta } from "@/lib/data";

export function RouteCard({ trail, priority = false }: { trail: Trail; priority?: boolean }) {
  const meta = levelMeta[trail.level];
  return (
    <Link
      href={`/rutas/${trail.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl2 border border-ink-700 bg-ink-900 transition-colors duration-300 hover:border-trail-400/50 cursor-pointer"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={trail.image}
          alt={`${trail.name} — ${trail.state}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
          priority={priority}
          className="object-cover transition-[filter,transform] duration-500 group-hover:scale-105 group-hover:brightness-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/10 to-transparent" />
        <span
          className={`absolute left-3 top-3 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-sm ${meta.className}`}
        >
          {meta.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-trail-400">
          {trail.region} · {trail.state}
        </p>
        <h3 className="mt-1 font-display text-3xl text-bone">{trail.name}</h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-mute">{trail.blurb}</p>

        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-ink-700 pt-4 text-sm">
          <Spec label="Distancia" value={`${trail.distanceKm} km`} />
          <Spec label="Desnivel" value={`${trail.elevationM} m`} />
          <Spec label="Duración" value={trail.duration} />
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
