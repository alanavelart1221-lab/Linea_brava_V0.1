import Link from "next/link";
import { Reveal, RevealGroup } from "./Reveal";

const pillars = [
  {
    label: "Rutas",
    href: "/rutas",
    blurb: "Rutas calificadas con tracks GPX para tu GPS.",
    cta: "Ver rutas",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
        <path d="M3 11l19-9-9 19-2-8-8-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Eventos",
    href: "/eventos",
    blurb: "Salidas en grupo: únete o crea la tuya.",
    cta: "Ver eventos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Marketplace",
    href: "/marketplace",
    blurb: "Partes, accesorios y equipamiento overland de la comunidad.",
    cta: "Ver marketplace",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M19 8v6m-3-3h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Comunidad",
    href: "/comunidad",
    blurb: "Comparte tus salidas, pregunta y conecta con la banda.",
    cta: "Ir a la comunidad",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Tips",
    href: "/tips",
    blurb: "Manejo, mantenimiento y equipo.",
    cta: "Ver tips",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
        <path d="M12 2a7 7 0 0 1 4 12.9V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.1A7 7 0 0 1 12 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 21h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function ExploreHub() {
  return (
    <section className="shell py-20 sm:py-28">
      <Reveal className="mb-12">
        <span className="eyebrow mb-4 flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-trail-500" />
          Todo en un lugar
        </span>
        <h2 className="h2 text-bone">
          Explora la comunidad<br />
          <span className="text-trail-500">Línea Brava.</span>
        </h2>
      </Reveal>

      <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {pillars.map((p) => (
          <Reveal key={p.href} as="div" className="card-line flex flex-col gap-4 p-6 transition-colors duration-300 hover:border-trail-400/50">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-trail-500/10 text-trail-500">
              {p.icon}
            </span>
            <div className="flex-1">
              <p className="font-display text-lg text-bone">{p.label}</p>
              <p className="mt-1 text-sm leading-relaxed text-mute">{p.blurb}</p>
            </div>
            <Link
              href={p.href}
              className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-trail-400 hover:text-trail-300"
            >
              {p.cta}
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14m0 0l-6-6m6 6l-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </Reveal>
        ))}
      </RevealGroup>
    </section>
  );
}
