import { useEffect, useMemo, useRef } from "react";
import { WebView } from "react-native-webview";
import { WAYPOINT_CATEGORIES, type Waypoint } from "@/lib/activities";
import type { Point } from "@/lib/geo";

function emojiFor(category: string) {
  return WAYPOINT_CATEGORIES.find((c) => c.key === category)?.emoji ?? "📍";
}

/**
 * Mapa "vivo" para seguir una ruta mientras se graba.
 * - Dibuja la ruta a seguir (ámbar) y sus waypoints una sola vez.
 * - Actualiza el trazo del usuario (esmeralda) y su posición vía injectJavaScript,
 *   sin recargar el mapa en cada punto.
 */
export function NavMapWebView({
  routeTrack,
  waypoints = [],
  userTrack,
  position,
  height,
  userColor = "#10B981",
  markerColor,
}: {
  routeTrack: Point[];
  waypoints?: Waypoint[];
  userTrack: Point[];
  position: Point | null;
  height?: number;
  userColor?: string;
  markerColor?: string;
}) {
  // El marcador de posición usa su propio color; por defecto, el del trazo.
  const dotColor = markerColor ?? userColor;
  const ref = useRef<WebView>(null);
  const ready = useRef(false);
  const center = routeTrack[0] ?? position ?? [23.6, -102.5];

  const wps = useMemo(
    () => waypoints.map((w) => ({ ...w, emoji: emojiFor(w.category) })),
    [waypoints]
  );

  const html = useMemo(
    () => `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#map{height:100%;margin:0;background:#0C0D0F;}</style>
</head>
<body>
<div id="map"></div>
<script>
  var routeTrack = ${JSON.stringify(routeTrack)};
  var wps = ${JSON.stringify(wps)};
  var userColor = ${JSON.stringify(userColor)};
  var dotColor = ${JSON.stringify(dotColor)};
  var map = L.map('map', { attributionControl: true }).setView([${center[0]}, ${center[1]}], 14);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd', maxZoom: 20,
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  }).addTo(map);

  if (routeTrack.length > 1) {
    var rline = L.polyline(routeTrack, { color: '#F59E0B', weight: 4, opacity: 0.9 }).addTo(map);
    map.fitBounds(rline.getBounds(), { padding: [40, 40] });
  }

  wps.forEach(function (w) {
    var icon = L.divIcon({
      className: '',
      html: '<span style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:9999px;background:#1A1D21;border:2px solid #F59E0B;font-size:14px;">' + w.emoji + '</span>',
      iconSize: [28, 28], iconAnchor: [14, 14]
    });
    L.marker([w.lat, w.lng], { icon: icon }).addTo(map).bindPopup('<b>' + (w.name || '') + '</b>');
  });

  var userLine = L.polyline([], { color: userColor, weight: 5, opacity: 0.95 }).addTo(map);
  var posMarker = null;

  window.setUser = function (t) { userLine.setLatLngs(t); };
  window.setPosition = function (lat, lng) {
    var ll = [lat, lng];
    if (!posMarker) {
      var icon = L.divIcon({
        className: '',
        html: '<span style="display:block;width:18px;height:18px;border-radius:9999px;background:' + dotColor + ';border:3px solid #0B0C0E;box-shadow:0 0 0 2px ' + dotColor + ';"></span>',
        iconSize: [18, 18], iconAnchor: [9, 9]
      });
      posMarker = L.marker(ll, { icon: icon }).addTo(map);
    } else {
      posMarker.setLatLng(ll);
    }
    map.panTo(ll, { animate: true });
  };
</script>
</body>
</html>`,
    // El HTML solo depende de la ruta a seguir y el color del usuario; el resto
    // se inyecta en vivo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(routeTrack), JSON.stringify(wps), userColor, dotColor]
  );

  function pushLive() {
    if (!ready.current) return;
    ref.current?.injectJavaScript(
      `if(window.setUser){window.setUser(${JSON.stringify(userTrack)});}` +
        (position ? `if(window.setPosition){window.setPosition(${position[0]},${position[1]});}` : "") +
        `true;`
    );
  }

  useEffect(() => {
    pushLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userTrack, position]);

  return (
    <WebView
      ref={ref}
      originWhitelist={["*"]}
      source={{ html }}
      style={height ? { height, backgroundColor: "#0C0D0F" } : { flex: 1, backgroundColor: "#0C0D0F" }}
      onLoadEnd={() => {
        ready.current = true;
        pushLive();
      }}
    />
  );
}
