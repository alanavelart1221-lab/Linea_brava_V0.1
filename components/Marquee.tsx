const items = [
  "Rutas con tracks GPX",
  "Directorio de talleres off-road",
  "Salidas en grupo para todo nivel",
  "Comunidad off-road",
  "Tips de manejo y equipo",
  "Descubre rutas nuevas",
  "Refacciones y proveedores cerca de ti",
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
