import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import { guardarActividad, type GuardarActividadInput, type Waypoint } from "./activities";
import type { Point } from "./geo";

// Almacenamiento local para uso sin internet. Reutiliza el AsyncStorage que ya
// configura Supabase para la sesión (mobile/lib/supabase.ts) — sin dependencias nuevas.

const ROUTE_PREFIX = "lbv:route:";
const ROUTE_INDEX = "lbv:routes";
const PENDING_KEY = "lbv:pendingActivities";

/** Ruta descargada para usar offline (subconjunto de user_routes). */
export type OfflineRoute = {
  id: string;
  name: string;
  track: Point[] | null;
  waypoints: Waypoint[] | null;
  description: string | null;
  state: string;
  region: string | null;
  level: string;
  distance_km: number | null;
};

/** Actividad en cola: el mismo payload de guardarActividad + un id local. */
export type PendingActivity = GuardarActividadInput & { localId: string };

// ---------- Rutas descargadas ----------

async function readIndex(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(ROUTE_INDEX);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

async function writeIndex(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(ROUTE_INDEX, JSON.stringify(ids));
}

/** Guarda (o actualiza) una ruta para usarla sin internet. */
export async function saveRouteOffline(route: OfflineRoute): Promise<void> {
  await AsyncStorage.setItem(ROUTE_PREFIX + route.id, JSON.stringify(route));
  const ids = await readIndex();
  if (!ids.includes(route.id)) await writeIndex([route.id, ...ids]);
}

/** Devuelve la ruta descargada o null si no está. */
export async function getOfflineRoute(id: string): Promise<OfflineRoute | null> {
  try {
    const raw = await AsyncStorage.getItem(ROUTE_PREFIX + id);
    return raw ? (JSON.parse(raw) as OfflineRoute) : null;
  } catch {
    return null;
  }
}

/** ¿La ruta está descargada? */
export async function isRouteOffline(id: string): Promise<boolean> {
  return (await AsyncStorage.getItem(ROUTE_PREFIX + id)) != null;
}

/** Lista todas las rutas descargadas. */
export async function listOfflineRoutes(): Promise<OfflineRoute[]> {
  const ids = await readIndex();
  if (ids.length === 0) return [];
  const pairs = await AsyncStorage.multiGet(ids.map((id) => ROUTE_PREFIX + id));
  const routes: OfflineRoute[] = [];
  for (const [, raw] of pairs) {
    if (!raw) continue;
    try {
      routes.push(JSON.parse(raw) as OfflineRoute);
    } catch {
      // ignora entradas corruptas
    }
  }
  return routes;
}

/** Quita una ruta descargada. */
export async function removeOfflineRoute(id: string): Promise<void> {
  await AsyncStorage.removeItem(ROUTE_PREFIX + id);
  const ids = await readIndex();
  await writeIndex(ids.filter((x) => x !== id));
}

// ---------- Cola de actividades pendientes ----------

/** Lee la cola de actividades aún no subidas. */
export async function getPendingActivities(): Promise<PendingActivity[]> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingActivity[]) : [];
  } catch {
    return [];
  }
}

async function writePending(list: PendingActivity[]): Promise<void> {
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(list));
}

/** Agrega una actividad a la cola local (para subir al reconectar). */
export async function enqueueActivity(payload: GuardarActividadInput): Promise<void> {
  const list = await getPendingActivities();
  const localId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  list.push({ ...payload, localId });
  await writePending(list);
}

/**
 * Intenta subir las actividades en cola. Las que se suben con éxito se quitan;
 * las que fallan (p. ej. sigue sin internet) quedan para el próximo intento.
 * Devuelve cuántas se subieron.
 */
export async function syncPendingActivities(): Promise<number> {
  const list = await getPendingActivities();
  if (list.length === 0) return 0;

  const remaining: PendingActivity[] = [];
  let synced = 0;
  for (const item of list) {
    // PendingActivity extiende GuardarActividadInput; el campo extra localId se ignora.
    const { error } = await guardarActividad(item);
    if (error) remaining.push(item);
    else synced += 1;
  }
  if (synced > 0) await writePending(remaining);
  return synced;
}
