import { supabase } from "./supabase";
import type { Point } from "./geo";
import { trackDistanceKm } from "./geo";

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

export const WAYPOINT_CATEGORIES: {
  key: WaypointCategory;
  label: string;
  emoji: string;
}[] = [
  { key: "peligro", label: "Peligro", emoji: "⚠️" },
  { key: "vista", label: "Vista", emoji: "📷" },
  { key: "agua", label: "Agua", emoji: "💧" },
  { key: "combustible", label: "Combustible", emoji: "⛽" },
  { key: "campamento", label: "Campamento", emoji: "⛺" },
  { key: "otro", label: "Otro", emoji: "📍" },
];

export type Nivel = "Verde" | "Azul" | "Negro" | "Pro";

type GuardarActividadInput = {
  userId: string;
  title: string | null;
  track: Point[];
  waypoints: Waypoint[];
  durationS: number;
  startedAt: string;
};

/** Guarda una actividad privada. Devuelve el id insertado o un error. */
export async function guardarActividad(
  input: GuardarActividadInput
): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from("user_activities")
    .insert({
      user_id: input.userId,
      title: input.title?.trim() || null,
      track: input.track,
      waypoints: input.waypoints,
      distance_km: parseFloat(trackDistanceKm(input.track).toFixed(2)),
      duration_s: input.durationS,
      started_at: input.startedAt,
    })
    .select("id")
    .single();

  if (error || !data) return { id: null, error: error?.message ?? "No se pudo guardar." };
  return { id: data.id as string, error: null };
}

type CrearRutaInput = {
  userId: string;
  activityId: string;
  name: string;
  state: string;
  region: string | null;
  level: Nivel;
  description: string | null;
  track: Point[];
  waypoints: Waypoint[];
};

/**
 * Publica una ruta de comunidad a partir de una actividad y las liga
 * (user_activities.route_id). La actividad sigue existiendo como registro privado.
 */
export async function crearRutaDesdeActividad(
  input: CrearRutaInput
): Promise<{ routeId: string | null; error: string | null }> {
  const start = input.track[0];
  const { data, error } = await supabase
    .from("user_routes")
    .insert({
      user_id: input.userId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      state: input.state.trim(),
      region: input.region?.trim() || null,
      level: input.level,
      distance_km: parseFloat(trackDistanceKm(input.track).toFixed(2)),
      track: input.track,
      start_coords: { lat: start[0], lng: start[1] },
      waypoints: input.waypoints,
      status: "approved",
    })
    .select("id")
    .single();

  if (error || !data) return { routeId: null, error: error?.message ?? "No se pudo crear la ruta." };

  await supabase
    .from("user_activities")
    .update({ route_id: data.id })
    .eq("id", input.activityId);

  return { routeId: data.id as string, error: null };
}
