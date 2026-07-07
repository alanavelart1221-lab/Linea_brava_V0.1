import { voices } from "@/lib/data";
import { Reveal, RevealGroup } from "./Reveal";

export function Community() {
  return (
    <section id="community" className="shell scroll-mt-24 py-20 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="eyebrow">La gente</span>
        <h2 className="h-section mt-4 text-bone">
          Hecho por conductores que<br />
          <span className="text-trail-500">se cuidan entre sí.</span>
        </h2>
        <p className="mt-5 text-mute">
          Rutas grabadas por quienes las recorrieron, conocimiento real en la comunidad y una red
          de proveedores que te tienen cubierto. Sin filtros, sin agencias — puro terreno.
        </p>
      </Reveal>

      <RevealGroup className="mt-14 grid gap-5 md:grid-cols-3">
        {voices.map((v) => (
          <Reveal
            key={v.name}
            as="div"
            className="card-line flex flex-col p-7 transition-colors duration-300 hover:border-trail-400/40"
          >
            <Quote />
            <p className="mt-5 flex-1 text-[0.975rem] leading-relaxed text-bone">
              &ldquo;{v.quote}&rdquo;
            </p>
            <div className="mt-7 flex items-center gap-3 border-t border-ink-700 pt-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-trail-500/15 font-display text-lg text-trail-400">
                {v.name.charAt(0)}
              </span>
              <div>
                <p className="text-sm font-semibold text-bone">{v.name}</p>
                <p className="text-xs text-mute">
                  {v.role} · {v.rig}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </RevealGroup>
    </section>
  );
}

function Quote() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 7H5a2 2 0 00-2 2v4a2 2 0 002 2h2v2a2 2 0 01-2 2H4m17-12h-4a2 2 0 00-2 2v4a2 2 0 002 2h2v2a2 2 0 01-2 2h-1"
        stroke="#F5821F"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
