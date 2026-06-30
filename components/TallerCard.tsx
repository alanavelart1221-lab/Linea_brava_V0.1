import Link from "next/link";
import type { Provider } from "@/lib/providers";

export interface TallerCardData extends Provider {
  distancia?: number; // km calculado en el cliente
}

function ServiceChips({ servicios }: { servicios: string[] }) {
  const shown = servicios.slice(0, 4);
  const remaining = servicios.length - shown.length;
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((s) => (
        <span
          key={s}
          className="flex items-center gap-1 rounded-full border border-ink-600 bg-ink-900 px-2.5 py-0.5 text-xs text-mute"
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-go-500" />
          {s}
        </span>
      ))}
      {remaining > 0 && (
        <span className="rounded-full border border-ink-600 bg-ink-900 px-2.5 py-0.5 text-xs text-mute">
          +{remaining} más
        </span>
      )}
    </div>
  );
}

export function TallerCard({ taller }: { taller: TallerCardData }) {
  const imagen = taller.gallery[0] ?? taller.logo_url;
  const mapsQuery = taller.address
    ? `${taller.address}, ${taller.city}, ${taller.state}`
    : `${taller.name} ${taller.city} ${taller.state}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;

  return (
    <article className="card-line flex flex-col overflow-hidden transition-shadow hover:shadow-[0_0_0_1px_theme(colors.trail.500/30)]">
      {/* Imagen */}
      <div className="relative aspect-video w-full overflow-hidden bg-ink-800">
        {imagen ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagen}
            alt={taller.name}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-mute/20">
            <svg
              viewBox="0 0 24 24"
              className="h-10 w-10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16M3 21h18M9 21V9h6v12M9 9h6" />
            </svg>
          </div>
        )}

        {/* Badge verificado */}
        {taller.verificado && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full border border-go-500/50 bg-ink-950/80 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-go-400 backdrop-blur-sm">
            <svg viewBox="0 0 16 16" className="h-3 w-3 fill-current">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.03 5.03a.75.75 0 10-1.06-1.06L7 7.94 5.53 6.47a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l3.5-3.5z" />
            </svg>
            Verificado
          </span>
        )}

        {/* Distancia */}
        {taller.distancia != null && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-ink-950/70 px-2.5 py-1 text-xs font-medium text-bone backdrop-blur-sm">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            {taller.distancia < 1
              ? `${Math.round(taller.distancia * 1000)} m`
              : `${taller.distancia.toFixed(1)} km`}
          </span>
        )}
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="font-display text-xl leading-tight text-bone">{taller.name}</h3>
          {taller.specialty.length > 0 && (
            <p className="mt-0.5 text-sm font-medium text-trail-400">
              {taller.specialty.slice(0, 2).join(" · ")}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          {(taller.address || taller.city) && (
            <span className="flex items-start gap-1.5 text-xs text-mute">
              <svg viewBox="0 0 24 24" className="mt-px h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              {taller.address
                ? `${taller.address}, ${taller.city}, ${taller.state}`
                : `${taller.city}, ${taller.state}`}
            </span>
          )}
          {taller.horario && (
            <span className="flex items-center gap-1.5 text-xs text-mute">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {taller.horario}
            </span>
          )}
        </div>

        {taller.servicios.length > 0 && (
          <ServiceChips servicios={taller.servicios} />
        )}

        {/* Botones */}
        <div className="mt-auto flex flex-wrap gap-2 pt-3">
          {taller.phone && (
            <a
              href={`tel:${taller.phone}`}
              className="flex items-center gap-1.5 rounded-full bg-trail-500 px-4 py-1.5 text-xs font-bold text-ink-950 transition-opacity hover:opacity-90"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="currentColor">
                <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.23c1.21.49 2.53.76 3.88.76a1 1 0 011 1V20a1 1 0 01-1 1C9.39 21 3 14.61 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.36.27 2.67.76 3.88a1 1 0 01-.22 1.11l-2.42 1.8z" />
              </svg>
              Llamar
            </a>
          )}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-ink-600 px-4 py-1.5 text-xs font-medium text-bone transition-colors hover:border-trail-500/50 hover:text-trail-400"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-10l6-3m0 13l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4" />
            </svg>
            Cómo llegar
          </a>
          <Link
            href={`/talleres/${taller.id}`}
            className="flex items-center gap-1.5 rounded-full border border-ink-600 px-4 py-1.5 text-xs font-medium text-bone transition-colors hover:border-trail-500/50 hover:text-trail-400"
          >
            Ver detalles
          </Link>
        </div>
      </div>
    </article>
  );
}
