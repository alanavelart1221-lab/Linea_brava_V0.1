"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  track: [number, number][];
  userPosition: [number, number] | null;
}

export default function GrabMapClient({ track, userPosition }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const pulseRef = useRef<L.CircleMarker | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    const startLatLng: L.LatLngExpression = userPosition ?? [23.6345, -102.5528]; // center Mexico
    const map = L.map(containerRef.current, {
      center: startLatLng,
      zoom: 14,
      zoomControl: false,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { attribution: "© CARTO", subdomains: "abcd", maxZoom: 19 }
    ).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    polylineRef.current = L.polyline([], { color: "#F59E0B", weight: 4 }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      initializedRef.current = false;
    };
  }, []);

  // Update track polyline
  useEffect(() => {
    if (!mapRef.current || !polylineRef.current) return;
    polylineRef.current.setLatLngs(track);
    if (track.length > 1) {
      mapRef.current.fitBounds(polylineRef.current.getBounds(), { padding: [40, 40] });
    }
  }, [track]);

  // Update user position
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userPosition) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userPosition);
      pulseRef.current?.setLatLng(userPosition);
    } else {
      pulseRef.current = L.circleMarker(userPosition, {
        radius: 16,
        fillColor: "#3B82F6",
        color: "#3B82F6",
        weight: 1,
        fillOpacity: 0.15,
      }).addTo(map);
      userMarkerRef.current = L.circleMarker(userPosition, {
        radius: 7,
        fillColor: "#60A5FA",
        color: "#fff",
        weight: 2,
        fillOpacity: 1,
      }).addTo(map);
    }

    if (track.length <= 1) {
      map.panTo(userPosition, { animate: true, duration: 1 });
    }
  }, [userPosition]);

  return <div ref={containerRef} className="h-full w-full" />;
}
