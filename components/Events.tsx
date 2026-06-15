import Link from "next/link";
import { events, levelMeta } from "@/lib/data";
import { formatEventDate, formatEventTime } from "@/lib/date";
import { Reveal, RevealGroup } from "./Reveal";

export function Events() {
  return (
    <section
      id="events"
      className="grain relative scroll-mt-24 overflow-hidden border-y border-ink-700 bg-ink-900/40 py-20 sm:py-28"
    >
      <div className="topo absolute inset-0 -z-10 opacity-40" />
      <div className="shell">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Reveal>
            <span className="eyebrow">Salidas en grupo</span>
            <h2 className="mt-4 font-display text-4xl tracking-tightest text-bone sm:text-5xl">
              Organiza o únete.<br />
              <span className="text-trail-500">La comunidad pone el terreno.</span>
            </h2>
            <p className="mt-4 max-w-md text-sm text-mute">
              Eventos creados por miembros de la comunidad: salidas grupales, expediciones
              y rodadas en las rutas del catálogo. Cualquiera puede organizar uno.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="flex flex-wrap items-center gap-3">
            <Link href="/eventos/crear" className="btn-primary">
              + Crear evento
            </Link>
            <a href="#join" className="btn-ghost">
              Ver todos
            </a>
          </Reveal>
        </div>

        <RevealGroup className="mt-12 flex flex-col gap-3">
          {events.map((ev) => {
            const date = formatEventDate(ev.date);
            const meta = levelMeta[ev.level];
            const pctLeft = Math.round((ev.spotsLeft / ev.spots) * 100);
            const almostFull = ev.spotsLeft <= 6;
            return (
              <Reveal
                key={ev.id}
                as="div"
                className="group card-line p-5 transition-colors duration-300 hover:border-trail-400/50 sm:p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                  {/* Date block */}
                  <div className="flex items-center gap-4 lg:w-44 lg:shrink-0">
                    <div className="flex flex-col items-center rounded-xl border border-ink-700 bg-ink-950 px-4 py-2">
                      <span className="font-display text-3xl leading-none text-trail-500">
                        {date.day}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-mute">
                        {date.month}
                      </span>
                    </div>
                    <div className="lg:hidden">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${meta.className}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-trail-400">
                        {ev.tag}
                      </span>
                      <span className="hidden text-xs text-mute lg:inline">
                        {date.weekday} · {formatEventTime(ev.date)}
                      </span>
                    </div>
                    <h3 className="font-display text-2xl text-bone sm:text-3xl">
                      {ev.title}
                    </h3>
                    <p className="mt-1 text-sm text-mute">{ev.location}</p>
                  </div>

                  {/* Availability */}
                  <div className="lg:w-52 lg:shrink-0">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="hidden font-medium text-mute lg:inline">
                        Lugares
                      </span>
                      <span
                        className={`font-semibold ${
                          almostFull ? "text-trail-400" : "text-bone"
                        }`}
                      >
                        {ev.spotsLeft} / {ev.spots}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
                      <div
                        className={`h-full rounded-full ${
                          almostFull ? "bg-trail-500" : "bg-go-500"
                        }`}
                        style={{ width: `${Math.max(6, 100 - pctLeft)}%` }}
                      />
                    </div>
                  </div>

                  {/* Action */}
                  <div className="lg:w-auto lg:shrink-0">
                    <span className="hidden lg:mb-2 lg:block">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${meta.className}`}
                      >
                        {meta.label}
                      </span>
                    </span>
                    <a href="#join" className="btn-primary w-full lg:w-auto">
                      Apuntarme
                    </a>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
