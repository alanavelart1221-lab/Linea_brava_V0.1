"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { getTrail } from "@/lib/data";

const NavMap = dynamic(() => import("@/components/NavMapClient"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-ink-900 text-mute text-sm">
      Cargando mapa…
    </div>
  ),
});

function haversineKm(a: [number, number], b: [number, number]) {
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

export default function NavegarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const trail = getTrail(slug);
  if (!trail) notFound();
  const track = trail.track;

  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [distanceLeft, setDistanceLeft] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const watchId = useRef<number | null>(null);

  function startNavigation() {
    if (!navigator.geolocation) {
      setGpsError("Tu dispositivo no soporta GPS.");
      return;
    }
    setStarted(true);
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const p: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(p);
        setGpsError(null);

        // Find closest point on track and calculate remaining distance
        if (track.length > 1) {
          let closest = 0;
          let minD = Infinity;
          track.forEach((pt, i) => {
            const d = haversineKm(p, pt);
            if (d < minD) { minD = d; closest = i; }
          });
          let remaining = 0;
          for (let i = closest; i < track.length - 1; i++) {
            remaining += haversineKm(track[i], track[i + 1]);
          }
          setDistanceLeft(remaining);
        }
      },
      (err) => setGpsError(err.message),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );
  }

  function stopNavigation() {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setStarted(false);
    setUserPos(null);
    setDistanceLeft(null);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  return (
    <div className="flex h-svh flex-col bg-ink-950">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-ink-700 bg-ink-900 px-4 py-3">
        <Link
          href={`/rutas/${slug}`}
          className="flex items-center gap-2 text-sm font-medium text-mute hover:text-bone"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M19 12H5m0 0l6 6m-6-6l6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Volver
        </Link>
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-trail-500">
            Modo Navegación
          </p>
          <p className="text-sm font-medium text-bone">{trail.name}</p>
        </div>
        <div className="w-16" />
      </div>

      {/* Map — fills remaining space */}
      <div className="relative flex-1 overflow-hidden">
        <NavMap
          track={trail.track}
          center={trail.coords}
          userPosition={userPos}
          name={trail.name}
        />

        {/* GPS error overlay */}
        {gpsError && (
          <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-xl border border-red-500/30 bg-ink-900/90 px-4 py-2 text-sm text-red-400 backdrop-blur-sm">
            {gpsError}
          </div>
        )}
      </div>

      {/* Bottom panel */}
      <div className="border-t border-ink-700 bg-ink-900 px-4 py-4">
        {started ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Pulsing GPS dot */}
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500" />
              </span>
              <div>
                <p className="text-xs text-mute">GPS activo</p>
                {distanceLeft !== null && (
                  <p className="text-sm font-semibold text-bone">
                    {distanceLeft.toFixed(1)} km restantes
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={stopNavigation}
              className="rounded-full border border-red-500/40 bg-red-500/10 px-5 py-2 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/20"
            >
              Detener
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <Stat label="Distancia" value={`${trail.distanceKm} km`} />
              <Stat label="Duración" value={trail.duration} />
              <Stat label="Desnivel" value={`${trail.elevationM} m`} />
            </div>
            <button
              onClick={startNavigation}
              className="btn-primary w-full"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" fill="currentColor" />
              </svg>
              Iniciar navegación GPS
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-700 bg-ink-950 py-2">
      <p className="text-[0.6rem] font-semibold uppercase tracking-widest text-mute">{label}</p>
      <p className="mt-0.5 font-display text-lg text-bone">{value}</p>
    </div>
  );
}
