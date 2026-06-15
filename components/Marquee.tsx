const items = [
  "Comparte el camino",
  "Rutas calificadas",
  "Aptas para camionetas de agencia",
  "Crea eventos en tu zona",
  "Expediciones overland",
  "Descubre rutas nuevas",
  "Campamentos bajo cielos oscuros",
];

export function Marquee() {
  return (
    <div className="relative flex overflow-hidden border-y border-ink-700 bg-ink-900/40 py-4">
      <div className="flex shrink-0 animate-marquee items-center gap-10 pr-10 motion-reduce:animate-none">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="flex items-center gap-10">
            <span className="font-display text-xl tracking-tightest text-mute">
              {item}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-trail-500" aria-hidden="true" />
          </span>
        ))}
      </div>
    </div>
  );
}
