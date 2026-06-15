"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window`, so load the map only in the browser (no SSR).
const Map = dynamic(() => import("./RouteMapClient"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-ink-900 text-sm text-mute">
      Cargando mapa…
    </div>
  ),
});

export function RouteMap(props: {
  coords: { lat: number; lng: number };
  track: [number, number][];
  name: string;
}) {
  return (
    <div className="h-full w-full overflow-hidden rounded-xl2 border border-ink-700">
      <Map {...props} />
    </div>
  );
}
