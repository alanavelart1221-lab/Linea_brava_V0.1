/**
 * Marca oficial de Línea Brava: tres picos de montaña en trazo continuo.
 * Única fuente de verdad de la geometría — cualquier otro asset (favicon,
 * íconos de app, og:image, PNGs de mobile) se deriva de estos mismos puntos.
 * El color se hereda vía currentColor: usar con `text-trail-500`.
 */
export default function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 225 68"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Trazo continuo: pico bajo, pico alto, pico medio con ladera extendida */}
      <polyline
        points="4,56 41,22 64.9,43.9 104,8 137.6,38.9 168,11 221,59.8"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinejoin="miter"
        strokeLinecap="butt"
      />
    </svg>
  );
}
