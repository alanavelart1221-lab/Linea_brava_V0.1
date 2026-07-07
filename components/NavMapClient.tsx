"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  track: [number, number][];
  center: { lat: number; lng: number };
  userPosition: [number, number] | null;
  name: string;
}

export default function NavMapClient({ track, center, userPosition, name }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const pulseMarkerRef = useRef<L.CircleMarker | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution: "© CARTO",
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    // Route polyline
    if (track.length > 1) {
      L.polyline(track, { color: "#F5821F", weight: 4, opacity: 0.9 }).addTo(map);

      // Start marker
      L.circleMarker(track[0], {
        radius: 7,
        fillColor: "#34D399",
        color: "#0C0D0F",
        weight: 2,
        fillOpacity: 1,
      })
        .bindTooltip("Inicio", { permanent: false })
        .addTo(map);

      // End marker
      L.circleMarker(track[track.length - 1], {
        radius: 7,
        fillColor: "#EF4444",
        color: "#0C0D0F",
        weight: 2,
        fillOpacity: 1,
      })
        .bindTooltip("Fin", { permanent: false })
        .addTo(map);

      map.fitBounds(L.polyline(track).getBounds(), { padding: [40, 40] });
    }

    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update user position marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userPosition) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userPosition);
      pulseMarkerRef.current?.setLatLng(userPosition);
    } else {
      // Outer pulse ring
      pulseMarkerRef.current = L.circleMarker(userPosition, {
        radius: 16,
        fillColor: "#3B82F6",
        color: "#3B82F6",
        weight: 1,
        fillOpacity: 0.15,
      }).addTo(map);

      // Inner dot
      userMarkerRef.current = L.circleMarker(userPosition, {
        radius: 7,
        fillColor: "#60A5FA",
        color: "#fff",
        weight: 2,
        fillOpacity: 1,
      })
        .bindTooltip("Tu posición", { permanent: false })
        .addTo(map);
    }

    map.panTo(userPosition, { animate: true, duration: 1 });
  }, [userPosition]);

  return <div ref={containerRef} className="h-full w-full" />;
}
