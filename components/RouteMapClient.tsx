"use client";

import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { WAYPOINT_META, type Waypoint } from "@/lib/routes";

function waypointIcon(emoji: string) {
  return L.divIcon({
    className: "",
    html: `<span style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:9999px;background:#1A1D21;border:2px solid #F5821F;font-size:14px;line-height:1;">${emoji}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

// Custom amber pin via divIcon — avoids Leaflet's bundler-broken default marker images.
const pin = L.divIcon({
  className: "",
  html: `<span style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9999px;background:#F5821F;box-shadow:0 0 0 4px rgba(245,130,31,0.25);">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M2 17L8 7l4 6 3-4 5 8H2z" fill="#08090A"/><circle cx="17" cy="6" r="2.2" fill="#08090A"/></svg>
  </span>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

export default function RouteMapClient({
  coords,
  track,
  name,
  waypoints = [],
}: {
  coords: { lat: number; lng: number };
  track: [number, number][];
  name: string;
  waypoints?: Waypoint[];
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
          pathOptions={{ color: "#F5821F", weight: 4, opacity: 0.9 }}
        />
      )}
      <Marker position={[coords.lat, coords.lng]} icon={pin}>
        <Popup>{name}</Popup>
      </Marker>
      {waypoints.map((w, i) => {
        const meta = WAYPOINT_META[w.category] ?? WAYPOINT_META.otro;
        return (
          <Marker key={i} position={[w.lat, w.lng]} icon={waypointIcon(meta.emoji)}>
            <Popup>
              <strong>{w.name}</strong>
              <br />
              {meta.label}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
