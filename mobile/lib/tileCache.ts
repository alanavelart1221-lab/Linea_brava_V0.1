import * as FileSystem from "expo-file-system/legacy";
import type { Point } from "./geo";

const TILE_DIR = FileSystem.cacheDirectory + "tiles/";
const TILE_URL = (z: number, x: number, y: number) =>
  `https://a.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png`;

function lonToTileX(lon: number, z: number) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, z));
}
function latToTileY(lat: number, z: number) {
  const r = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) *
      Math.pow(2, z)
  );
}

function tilePath(z: number, x: number, y: number) {
  return `${TILE_DIR}${z}_${x}_${y}.png`;
}

export async function getTileBase64(
  z: number,
  x: number,
  y: number
): Promise<string | null> {
  try {
    const path = tilePath(z, x, y);
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) {
      return await FileSystem.readAsStringAsync(path, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }
  } catch {
    // ignore
  }
  return null;
}

export async function cacheTilesForTrack(
  track: Point[],
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  if (track.length === 0) return;

  const dirInfo = await FileSystem.getInfoAsync(TILE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(TILE_DIR, { intermediates: true });
  }

  const lats = track.map((p) => p[0]);
  const lons = track.map((p) => p[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const tiles: { z: number; x: number; y: number }[] = [];
  for (const z of [13, 14, 15]) {
    const x0 = lonToTileX(minLon, z);
    const x1 = lonToTileX(maxLon, z);
    const y0 = latToTileY(maxLat, z);
    const y1 = latToTileY(minLat, z);
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        tiles.push({ z, x, y });
      }
    }
  }

  let done = 0;
  const BATCH = 8;
  for (let i = 0; i < tiles.length; i += BATCH) {
    const batch = tiles.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async ({ z, x, y }) => {
        const path = tilePath(z, x, y);
        const info = await FileSystem.getInfoAsync(path);
        if (!info.exists) {
          try {
            await FileSystem.downloadAsync(TILE_URL(z, x, y), path);
          } catch {
            // skip failed tiles silently
          }
        }
        done++;
        onProgress?.(done, tiles.length);
      })
    );
  }
}

export async function routeIsCached(track: Point[]): Promise<boolean> {
  if (track.length === 0) return false;
  const lats = track.map((p) => p[0]);
  const lons = track.map((p) => p[1]);
  const z = 14;
  const x = lonToTileX((Math.min(...lons) + Math.max(...lons)) / 2, z);
  const y = latToTileY((Math.min(...lats) + Math.max(...lats)) / 2, z);
  const info = await FileSystem.getInfoAsync(tilePath(z, x, y));
  return info.exists;
}
