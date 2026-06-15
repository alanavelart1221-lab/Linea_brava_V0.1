import type { Provider } from "@/lib/providers";
import { TYPE_META } from "@/lib/providers";

export function ProviderCard({ provider }: { provider: Provider }) {
  const meta = TYPE_META[provider.type];
  const initials = provider.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <article className="card-line flex flex-col gap-5 p-6 transition-colors hover:border-ink-600">
      <div className="flex items-start gap-4">
        {/* Logo placeholder */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ink-800 font-display text-lg text-trail-500">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-xl text-bone">{provider.name}</h3>
            {provider.featured && (
              <span className="rounded-full border border-trail-500/40 bg-trail-500/10 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest text-trail-400">
                Destacado
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}>
              {meta.label}
            </span>
            <span className="text-xs text-mute">
              {provider.city}, {provider.state}
            </span>
          </div>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-mute">{provider.description}</p>

      <div className="flex flex-wrap gap-1.5">
        {provider.specialty.map((s) => (
          <span
            key={s}
            className="rounded-full border border-ink-600 bg-ink-900 px-2.5 py-0.5 text-xs text-mute"
          >
            {s}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-ink-700 pt-4">
        <a
          href={`tel:${provider.phone}`}
          className="text-sm font-medium text-bone transition-colors hover:text-trail-400"
        >
          {provider.phone}
        </a>
        <a
          href={`mailto:contacto@lineabrava.mx?subject=Cotización: ${encodeURIComponent(provider.name)}`}
          className="rounded-full border border-trail-500/50 bg-trail-500/10 px-4 py-1.5 text-sm font-semibold text-trail-400 transition-colors hover:bg-trail-500/20"
        >
          Solicitar cotización
        </a>
      </div>
    </article>
  );
}
