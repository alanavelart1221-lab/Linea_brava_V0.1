import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Reveal, RevealGroup } from "@/components/Reveal";
import { createClient } from "@/lib/supabase/server";
import { levelMeta } from "@/lib/data";
import { formatEventDate, formatEventTime } from "@/lib/date";
import type { EventItem } from "@/lib/data";

export const revalidate = 60;

export default async function EventosPage() {
  const supabase = await createClient();
  const { data: userEvents } = await supabase
    .from("user_events")
    .select("*")
    .eq("status", "approved")
    .order("date", { ascending: true });

  const allEvents: EventItem[] = (userEvents ?? []).map((e) => ({
    id: e.id,
    date: e.date,
    title: e.title,
    location: e.location,
    level: e.level,
    spots: e.spots,
    spotsLeft: e.spots_left,
    tag: e.tag,
  }));

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-20">
        <div className="shell">
          {/* Header */}
          <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <Reveal>
              <span className="eyebrow mb-4 flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-trail-500" />
                Salidas en grupo
              </span>
              <h1 className="h2 text-trail-500">Eventos de la comunidad</h1>
              <p className="mt-4 max-w-md text-mute">
                Eventos creados por la comunidad. Cualquier miembro puede organizar
                una salida, expedición o rodada grupal.
              </p>
            </Reveal>
            <Reveal delay={0.1} className="shrink-0">
              <Link href="/eventos/crear" className="btn-primary">
                + Crear evento
              </Link>
            </Reveal>
          </div>

          {/* Events list */}
          <RevealGroup className="flex flex-col gap-3">
            {allEvents.map((ev) => {
              const date = formatEventDate(ev.date);
              const meta = levelMeta[ev.level];
              const pctFilled = Math.round(((ev.spots - ev.spotsLeft) / ev.spots) * 100);
              const almostFull = ev.spotsLeft <= 6;
              return (
                <Reveal
                  key={ev.id}
                  as="div"
                  className="card-line p-5 transition-colors hover:border-trail-400/50 sm:p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                    {/* Date */}
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
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${meta.className}`}>
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
                      <h2 className="font-display text-2xl text-bone sm:text-3xl">{ev.title}</h2>
                      <p className="mt-1 text-sm text-mute">{ev.location}</p>
                    </div>

                    {/* Availability */}
                    <div className="lg:w-52 lg:shrink-0">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="hidden font-medium text-mute lg:inline">Lugares</span>
                        <span className={`font-semibold ${almostFull ? "text-trail-400" : "text-bone"}`}>
                          {ev.spotsLeft} / {ev.spots}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
                        <div
                          className={`h-full rounded-full ${almostFull ? "bg-trail-500" : "bg-go-500"}`}
                          style={{ width: `${Math.max(6, pctFilled)}%` }}
                        />
                      </div>
                    </div>

                    {/* Action */}
                    <div className="lg:shrink-0">
                      <span className="hidden lg:mb-2 lg:block">
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${meta.className}`}>
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

          {allEvents.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <p className="text-lg text-bone">No hay eventos programados aún.</p>
              <p className="text-sm text-mute">¡Sé el primero en organizar una salida!</p>
              <Link href="/eventos/crear" className="btn-primary mt-2">
                Crear el primer evento
              </Link>
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 rounded-2xl border border-trail-500/30 bg-trail-500/5 p-8 text-center">
            <h2 className="font-display text-2xl text-bone">¿Organizas salidas en tu zona?</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-mute">
              Publica tu evento en el calendario de la comunidad. Llega a miles de
              entusiastas off-road en todo México.
            </p>
            <Link href="/eventos/crear" className="btn-primary mt-6 inline-flex">
              + Crear evento
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
