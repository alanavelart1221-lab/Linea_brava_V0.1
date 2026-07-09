// Port del lib/relativeTime.ts de la web sin Intl.RelativeTimeFormat
// (no está disponible de forma confiable en Hermes).

/** "hace 5 min", "hace 2 h", o fecha corta si pasó más de una semana. */
export function relativeTime(iso: string): string {
  const date = new Date(iso);
  const diffSec = Math.round((Date.now() - date.getTime()) / 1000);
  const abs = Math.abs(diffSec);

  if (abs < 60) return "ahora";
  if (abs < 3600) return `hace ${Math.round(abs / 60)} min`;
  if (abs < 86400) return `hace ${Math.round(abs / 3600)} h`;
  if (abs < 604800) return `hace ${Math.round(abs / 86400)} d`;

  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}
