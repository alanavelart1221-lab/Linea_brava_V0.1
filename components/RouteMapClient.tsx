"use client";

import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom amber pin via divIcon — avoids Leaflet's bundler-broken default marker images.
const pin = L.divIcon({
  className: "",
  html: `<span style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9999px;background:#F59E0B;box-shadow:0 0 0 4px rgba(245,158,11,0.25);">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M2 17L8 7l4 6 3-4 5 8H2z" fill="#08090A"/><circle cx="17" cy="6" r="2.2" fill="#08090A"/></svg>
  </span>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

export default function RouteMapClient({
  coords,
  track,
  name,
}: {
  coords: { lat: number; lng: number };
  track: [number, number][];
  name: string;
}) {
  return (
    <MapContainer
      center={[coords.lat, coords.lng]}
      zoom={11}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", background: "#0C0D0F" }}
      attributionControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={20}
      />
      {track.length > 1 && (
        <Polyline
          positions={track}
          pathOptions={{ color: "#F59E0B", weight: 4, opacity: 0.9 }}
        />
      )}
      <Marker position={[coords.lat, coords.lng]} icon={pin}>
        <Popup>{name}</Popup>
      </Marker>
    </MapContainer>
  );
}
