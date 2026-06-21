import type { TrailLevel } from "@/lib/data";

// Waypoints (puntos de interés que el usuario marca al grabar en la app).
export type WaypointCategory =
  | "peligro"
  | "vista"
  | "agua"
  | "combustible"
  | "campamento"
  | "otro";

export interface Waypoint {
  lat: number;
  lng: number;
  name: string;
  category: WaypointCategory;
}

export const WAYPOINT_META: Record<WaypointCategory, { label: string; emoji: string }> = {
  peligro: { label: "Peligro", emoji: "⚠️" },
  vista: { label: "Vista", emoji: "📷" },
  agua: { label: "Agua", emoji: "💧" },
  combustible: { label: "Combustible", emoji: "⛽" },
  campamento: { label: "Campamento", emoji: "⛺" },
  otro: { label: "Punto", emoji: "📍" },
};

// Ruta de comunidad (tabla `user_routes`) tal como la consume la web pública.
export interface CommunityRoute {
  id: string;
  name: string;
  state: string;
  region: string | null;
  level: TrailLevel;
  distance_km: number | null;
  calificada: boolean;
}

// Forma unificada para listar/filtrar rutas oficiales y de comunidad juntas.
export interface RouteListItem {
  kind: "oficial" | "comunidad";
  key: string;
  name: string;
  state: string;
  region: string | null;
  level: TrailLevel;
  distanceKm: number | null;
  href: string;
  blurb?: string;
  image?: string | null;
  calificada?: boolean;
  elevationM?: number | null;
  duration?: string | null;
}

// Ruta completa tal como vive en `user_routes` (oficial o de comunidad).
export interface RouteFull {
  id: string;
  slug: string | null;
  name: string;
  blurb: string | null;
  description: string | null;
  state: string;
  region: string | null;
  level: TrailLevel;
  distanceKm: number | null;
  elevationM: number | null;
  duration: string | null;
  bestSeason: string | null;
  terrain: string[];
  gear: string[];
  gallery: string[];
  image: string | null;
  track: [number, number][];
  startCoords: { lat: number; lng: number } | null;
  calificada: boolean;
  origen: "oficial" | "comunidad";
}
