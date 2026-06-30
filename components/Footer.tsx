const columns = [
  {
    title: "Explora",
    links: [
      { label: "Rutas", href: "/rutas" },
      { label: "Eventos", href: "/eventos" },
      { label: "Tips", href: "/tips" },
      { label: "Marketplace", href: "/marketplace" },
      { label: "Foro", href: "/foro" },
    ],
  },
  {
    title: "Comunidad",
    links: [
      { label: "Crear evento", href: "/eventos/crear" },
      { label: "Mi perfil", href: "/perfil" },
      { label: "Código del camino", href: "/#faq" },
    ],
  },
  {
    title: "Contacto",
    links: [
      { label: "crew@lineabrava.mx", href: "mailto:crew@lineabrava.mx" },
      { label: "Kit de prensa", href: "#" },
      { label: "Sé patrocinador", href: "#" },
    ],
  },
];

const socials = [
  { label: "Instagram", href: "#", d: "M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm5 5a5 5 0 100 10 5 5 0 000-10zm6-1a1 1 0 110 2 1 1 0 010-2z" },
  { label: "YouTube", href: "#", d: "M22 8.2a3 3 0 00-2.1-2.1C18 5.5 12 5.5 12 5.5s-6 0-7.9.6A3 3 0 002 8.2 31 31 0 002 12a31 31 0 00.1 3.8 3 3 0 002.1 2.1c1.9.6 7.8.6 7.8.6s6 0 7.9-.6a3 3 0 002.1-2.1A31 31 0 0022 12a31 31 0 00-.1-3.8zM10 15V9l5 3-5 3z" },
  { label: "Strava", href: "#", d: "M10.5 2L4 14h3.9l2.6-5 2.6 5H17L10.5 2zm4 12l-1.8 3.4-1.8-3.4H7.2L12.7 22l5.5-8h-3.7z" },
];

export function Footer() {
  return (
    <footer className="grain relative overflow-hidden border-t border-ink-700 bg-ink-900/40">
      <div className="topo absolute inset-0 -z-10 opacity-30" aria-hidden="true" />
      <div className="shell py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,0.8fr)]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-trail-500 text-ink-950">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M2 17L8 7l4 6 3-4 5 8H2z" fill="currentColor" fillOpacity="0.92" />
                  <circle cx="17" cy="6" r="2.2" fill="currentColor" />
                </svg>
              </span>
              <span className="font-display text-xl tracking-tightest text-bone">
                LINEA BRAVA
              </span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-mute">
              La plataforma todoterreno de México. Graba, crea y encuentra rutas y
              eventos off-road en todo el país.
            </p>
            <div className="mt-6 flex gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-600 text-mute transition-colors hover:border-trail-400 hover:text-trail-300 cursor-pointer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d={s.d} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="font-display text-lg tracking-tightest text-bone">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="link-underline text-sm text-mute transition-colors hover:text-bone"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-ink-700 pt-7 sm:flex-row">
          <p className="text-xs text-mute">
            © {new Date().getFullYear()} Linea Brava. Rueda seguro, rueda en grupo.
          </p>
          <div className="flex gap-6 text-xs text-mute">
            <a href="#" className="link-underline hover:text-bone">Privacidad</a>
            <a href="#" className="link-underline hover:text-bone">Términos</a>
            <a href="#" className="link-underline hover:text-bone">Deslindes</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
