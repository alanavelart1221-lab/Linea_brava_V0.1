import { stats } from "@/lib/data";
import { CountUp } from "./CountUp";
import { Reveal, RevealGroup } from "./Reveal";

export function Stats() {
  return (
    <section className="shell py-20 sm:py-28">
      <RevealGroup className="grid grid-cols-2 gap-px overflow-hidden rounded-xl2 border border-ink-700 bg-ink-700 lg:grid-cols-4">
        {stats.map((s) => (
          <Reveal
            key={s.label}
            as="div"
            className="group bg-ink-900 p-7 transition-colors duration-300 hover:bg-ink-800 sm:p-9"
          >
            <p className="font-display text-5xl text-trail-500 sm:text-6xl">
              <CountUp to={s.value} suffix={s.suffix} />
            </p>
            <p className="mt-2 text-sm text-mute">{s.label}</p>
          </Reveal>
        ))}
      </RevealGroup>
    </section>
  );
}
