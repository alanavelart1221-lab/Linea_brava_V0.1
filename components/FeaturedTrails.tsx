import Link from "next/link";
import { trails } from "@/lib/data";
import { RouteCard } from "./RouteCard";
import { Reveal, RevealGroup } from "./Reveal";

// A curated handful for the landing — the full set lives at /rutas.
const featured = trails.slice(0, 3);

export function FeaturedTrails() {
  return (
    <section id="trails" className="shell scroll-mt-24 py-20 sm:py-28">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <Reveal>
          <span className="eyebrow">El terreno</span>
          <h2 className="h-section mt-4 max-w-2xl text-bone">
            Rutas calificadas para que<br />
            <span className="text-trail-500">siempre sepas la línea.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <Link href="/rutas" className="btn-ghost">
            Ver todas las rutas
          </Link>
        </Reveal>
      </div>

      <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((t, i) => (
          <Reveal key={t.slug} delay={Math.min(i * 0.08, 0.24)}>
            <RouteCard trail={t} priority={i === 0} />
          </Reveal>
        ))}
      </RevealGroup>
    </section>
  );
}
