import Link from "next/link";
import { Reveal } from "./Reveal";

export function FeaturedTip() {
  return (
    <section className="shell py-20 sm:py-28">
      <Reveal className="mx-auto max-w-3xl">
        <span className="eyebrow mb-4 flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-trail-500" />
          Tips off-road
        </span>
        <h2 className="h-section max-w-2xl text-bone">
          Conocimiento del<br />
          <span className="text-trail-500">camino.</span>
        </h2>
        <p className="mt-5 max-w-xl text-mute">
          Mecánica, equipo y técnica explicados por gente que lo vive. Aprende antes de meterte al terreno.
        </p>

        <div className="mt-10 overflow-hidden rounded-2xl border border-ink-700">
          <div className="aspect-video w-full">
            <iframe
              src="https://www.youtube.com/embed/ZY-gVcdYBT0?si=_2-JoPLXrZVyDpSW&start=78"
              title="Cherokee XJ — virtudes y desventajas | Linea Brava"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Link href="/tips" className="btn-primary">
            Más tips sobre off-road
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
