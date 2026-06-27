import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { haversineKm, type Point } from "./geo";

// Nombre de la tarea de fondo. Debe ser estable y único en la app.
export const TRACK_TASK = "lbv-track";

type Listener = (track: Point[]) => void;

// Store en memoria a nivel de módulo: la tarea de fondo escribe aquí y la
// pantalla se suscribe para pintar en vivo. (Se reinicia en cada startTracking.)
let track: Point[] = [];
let listeners: Listener[] = [];

// Suscripción de primer plano (fallback para Expo Go, donde el modo de fondo
// no está disponible). Solo se usa si startLocationUpdatesAsync falla.
let fgWatcher: Location.LocationSubscription | null = null;

function pushPoint(p: Point) {
  // Mismo filtro que la grabación libre: ignora puntos casi pegados (< ~10 m).
  if (track.length > 0 && haversineKm(track[track.length - 1], p) < 0.01) return;
  track = [...track, p];
  listeners.forEach((l) => l(track));
}

// Registra la tarea de fondo al importar el módulo (requisito de TaskManager).
TaskManager.defineTask(TRACK_TASK, async ({ data, error }) => {
  if (error) return;
  const locs = (data as { locations?: Location.LocationObject[] } | undefined)?.locations;
  if (!locs) return;
  for (const loc of locs) {
    pushPoint([loc.coords.latitude, loc.coords.longitude]);
  }
});

export function getTrack(): Point[] {
  return track;
}

export function subscribe(cb: Listener): () => void {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

/**
 * Pide permisos e inicia la grabación (incluye segundo plano si el usuario lo
 * concede). Devuelve un mensaje de error o null si arrancó bien.
 */
export async function startTracking(): Promise<string | null> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== "granted") {
    return "Necesitamos tu ubicación para grabar la ruta.";
  }
  // Best-effort: si no se concede el background, seguimos grabando en primer plano.
  await Location.requestBackgroundPermissionsAsync().catch(() => undefined);

  track = [];
  listeners.forEach((l) => l(track));

  // Por si quedó una grabación previa colgada.
  const already = await Location.hasStartedLocationUpdatesAsync(TRACK_TASK).catch(() => false);
  if (already) await Location.stopLocationUpdatesAsync(TRACK_TASK).catch(() => undefined);
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
  return null;
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

/** Detiene la grabación y devuelve el track final acumulado. */
export async function stopTracking(): Promise<Point[]> {
  const started = await Location.hasStartedLocationUpdatesAsync(TRACK_TASK).catch(() => false);
  if (started) await Location.stopLocationUpdatesAsync(TRACK_TASK).catch(() => undefined);
  if (fgWatcher) {
    fgWatcher.remove();
    fgWatcher = null;
  }
  return track;
}
