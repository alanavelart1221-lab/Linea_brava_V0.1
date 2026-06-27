export type Point = [number, number]; // [lat, lng]

// Radios de geocerca (en km). El inicio y el fin de una ruta usan el mismo radio
// por defecto; ~0.08 km = 80 m, tolerante a la imprecisión típica del GPS.
export const START_RADIUS_KM = 0.08;
export const END_RADIUS_KM = 0.08;

/** ¿Está el punto `a` dentro de `km` del punto `b`? (Haversine). */
export function withinRadius(a: Point, b: Point, km: number): boolean {
  return haversineKm(a, b) <= km;
}

/**
 * Inicio y fin de una ruta a partir de su track. El inicio es el primer punto y
 * el fin el último. Devuelve null si el track no tiene al menos 2 puntos.
 */
export function routeEndpoints(track: Point[] | null | undefined): {
  start: Point;
  end: Point;
} | null {
  if (!track || track.length < 2) return null;
  return { start: track[0], end: track[track.length - 1] };
}

/** Distancia en km entre dos coordenadas (Haversine). */
export function haversineKm(a: Point, b: Point): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) *
      Math.cos((b[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

/** Distancia total acumulada de un track. */
export function trackDistanceKm(track: Point[]): number {
  let total = 0;
  for (let i = 1; i < track.length; i++) total += haversineKm(track[i - 1], track[i]);
  return total;
}

/**
 * Validación básica de la ruta antes de publicar (misma que la web):
 * ≥10 puntos, ≥0.5 km y todas las coords dentro de México.
 * Devuelve un mensaje de error o null si es válida.
 */
export function validarTrack(track: Point[]): string | null {
  if (track.length < 10) {
    return "La ruta tiene muy pocos puntos GPS. Graba un recorrido más largo.";
  }
  if (trackDistanceKm(track) < 0.5) {
    return "La ruta es demasiado corta (menos de 0.5 km).";
  }
  const fueraDeMexico = track.some(
    ([lat, lng]) => lat < 14 || lat > 33 || lng < -118 || lng > -86
  );
  if (fueraDeMexico) {
    return "El recorrido tiene coordenadas fuera de México. Revisa tu GPS.";
  }
  return null;
}
