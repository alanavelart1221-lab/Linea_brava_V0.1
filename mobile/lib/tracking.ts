import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { haversineKm, type Point } from "./geo";
import type { Waypoint } from "./activities";

// Nombre de la tarea de fondo. Debe ser estable y único en la app.
export const TRACK_TASK = "lbv-track";

// Clave en disco para la grabación en curso. Persistir aquí es lo que permite
// sobrevivir a que el SO mate y relance el proceso en segundo plano.
const ACTIVE_KEY = "lbv:activeRec";

type Listener = (track: Point[]) => void;

/** De dónde viene la grabación, para reconstruir la pantalla al reabrir. */
export type RecContext =
  | { kind: "free" }
  | { kind: "route"; routeId: string; routeName: string | null };

/** Grabación activa, tal cual se guarda en disco. */
export type ActiveRec = {
  startedAt: number;
  track: Point[];
  waypoints: Waypoint[];
  context: RecContext;
};

// Store en memoria a nivel de módulo. La tarea de fondo escribe aquí y la
// pantalla se suscribe para pintar en vivo. En un relanzamiento de fondo el
// módulo se recarga vacío, por eso `hydrate()` lo rehidrata desde disco.
let track: Point[] = [];
let waypoints: Waypoint[] = [];
let startedAt = 0;
let context: RecContext | null = null;
// ¿Ya cargamos el estado desde disco en este ciclo de vida del proceso?
let loaded = false;

let listeners: Listener[] = [];

// Suscripción de primer plano (fallback para Expo Go, donde el modo de fondo
// no está disponible). Solo se usa si startLocationUpdatesAsync falla.
let fgWatcher: Location.LocationSubscription | null = null;

// ---------- Persistencia ----------

// Escrituras encadenadas: cada flush se ejecuta después del anterior, en orden,
// escribiendo siempre el estado más reciente. Así evitamos carreras de
// AsyncStorage (que una escritura vieja pise a una nueva). Devuelve la promesa
// de ESTA escritura, para poder esperarla al cerrar un lote en segundo plano.
let flushQueue: Promise<void> = Promise.resolve();
function flush(): Promise<void> {
  flushQueue = flushQueue
    .then(async () => {
      if (!context) return;
      const rec: ActiveRec = { startedAt, track, waypoints, context };
      await AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify(rec));
    })
    .catch(() => undefined);
  return flushQueue;
}

async function hydrate(): Promise<void> {
  if (loaded) return;
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_KEY);
    if (raw) {
      const rec = JSON.parse(raw) as ActiveRec;
      track = rec.track ?? [];
      waypoints = rec.waypoints ?? [];
      startedAt = rec.startedAt ?? Date.now();
      context = rec.context ?? null;
    }
  } catch {
    // Estado corrupto: arrancamos limpio.
  }
  loaded = true;
  listeners.forEach((l) => l(track));
}

function pushPoint(p: Point) {
  // Mismo filtro que la grabación libre: ignora puntos casi pegados (< ~10 m).
  if (track.length > 0 && haversineKm(track[track.length - 1], p) < 0.01) return;
  track = [...track, p];
  listeners.forEach((l) => l(track));
  flush();
}

// Registra la tarea de fondo al importar el módulo (requisito de TaskManager).
// En un relanzamiento de fondo este handler corre con la memoria vacía, por eso
// rehidrata desde disco ANTES de agregar puntos: así continúa el track en vez
// de empezar de cero.
TaskManager.defineTask(TRACK_TASK, async ({ data, error }) => {
  if (error) return;
  const locs = (data as { locations?: Location.LocationObject[] } | undefined)?.locations;
  if (!locs) return;
  await hydrate();
  for (const loc of locs) {
    pushPoint([loc.coords.latitude, loc.coords.longitude]);
  }
  // Asegura que el lote quede en disco antes de que el SO suspenda el proceso.
  await flush();
});

export function getTrack(): Point[] {
  return track;
}

export function getWaypoints(): Waypoint[] {
  return waypoints;
}

export function getStartedAt(): number {
  return startedAt;
}

export function subscribe(cb: Listener): () => void {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

/** Lee la grabación en curso desde disco (sin alterar la memoria del módulo). */
export async function getActiveRecording(): Promise<ActiveRec | null> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_KEY);
    return raw ? (JSON.parse(raw) as ActiveRec) : null;
  } catch {
    return null;
  }
}

/** Agrega un waypoint a la grabación en curso (memoria + disco). */
export function addWaypoint(wp: Waypoint) {
  waypoints = [...waypoints, wp];
  flush();
}

// Arranca las actualizaciones de ubicación (fondo si se puede, primer plano como
// fallback). No toca el track; lo usan tanto startTracking como resumeTracking.
async function beginUpdates(): Promise<void> {
  // Por si quedó una grabación previa colgada.
  const already = await Location.hasStartedLocationUpdatesAsync(TRACK_TASK).catch(() => false);
  if (already) return;
  if (fgWatcher) {
    fgWatcher.remove();
    fgWatcher = null;
  }
  try {
    // Grabación en segundo plano (requiere build propio; no funciona en Expo Go).
    await Location.startLocationUpdatesAsync(TRACK_TASK, {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 2000,
      distanceInterval: 5,
      showsBackgroundLocationIndicator: true,
      pausesUpdatesAutomatically: false,
      foregroundService: {
        notificationTitle: "Línea Brava — grabando ruta",
        notificationBody: "Tu recorrido se está grabando, incluso con la pantalla apagada.",
        notificationColor: "#F59E0B",
      },
    });
  } catch {
    // Fallback (p. ej. Expo Go): grabamos solo en primer plano, con la pantalla
    // encendida. Suficiente para probar; en un build propio se usa el de fondo.
    fgWatcher = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,
        distanceInterval: 5,
      },
      (loc) => pushPoint([loc.coords.latitude, loc.coords.longitude])
    );
  }
}

/**
 * Pide permisos e inicia una grabación nueva (incluye segundo plano si el usuario
 * lo concede). `context` indica el origen para poder reanudar al reabrir.
 * Devuelve un mensaje de error o null si arrancó bien.
 */
export async function startTracking(ctx: RecContext): Promise<string | null> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== "granted") {
    return "Necesitamos tu ubicación para grabar la ruta.";
  }
  // Best-effort: si no se concede el background, seguimos grabando en primer plano.
  await Location.requestBackgroundPermissionsAsync().catch(() => undefined);

  // Estado nuevo, dueño de startedAt/track/waypoints.
  track = [];
  waypoints = [];
  startedAt = Date.now();
  context = ctx;
  loaded = true;
  listeners.forEach((l) => l(track));
  await flush();

  await beginUpdates();
  return null;
}

/**
 * Reanuda una grabación que ya existía en disco (tras cerrar y reabrir la app, o
 * un relanzamiento de fondo). Rehidrata la memoria y se asegura de que las
 * actualizaciones de ubicación sigan corriendo, sin tocar el track acumulado.
 */
export async function resumeTracking(): Promise<void> {
  loaded = false;
  await hydrate();
  if (!context) return;
  await beginUpdates();
}

/**
 * Watcher de primer plano para la fase de aproximación (ir hacia el inicio de la
 * ruta), separado de la grabación. NO escribe en el `track` de módulo ni notifica
 * a los listeners de grabación: solo reporta la posición en vivo al callback.
 * Devuelve un objeto con `remove()` o un mensaje de error si no hay permiso.
 */
export async function watchApproach(
  cb: (p: Point) => void
): Promise<{ remove: () => void } | string> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== "granted") {
    return "Necesitamos tu ubicación para guiarte al inicio de la ruta.";
  }
  const sub = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 2000,
      distanceInterval: 5,
    },
    (loc) => cb([loc.coords.latitude, loc.coords.longitude])
  );
  return { remove: () => sub.remove() };
}

/** Detiene la grabación, borra el registro en disco y devuelve el track final. */
export async function stopTracking(): Promise<Point[]> {
  const started = await Location.hasStartedLocationUpdatesAsync(TRACK_TASK).catch(() => false);
  if (started) await Location.stopLocationUpdatesAsync(TRACK_TASK).catch(() => undefined);
  if (fgWatcher) {
    fgWatcher.remove();
    fgWatcher = null;
  }
  const finalTrack = track;
  context = null;
  await AsyncStorage.removeItem(ACTIVE_KEY).catch(() => undefined);
  return finalTrack;
}
