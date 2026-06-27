import { useRef } from "react";
import { WebView } from "react-native-webview";
import type { WebViewMessageEvent } from "react-native-webview";
import { WAYPOINT_CATEGORIES, type Waypoint } from "@/lib/activities";
import type { Point } from "@/lib/geo";
import { LEAFLET_CSS, LEAFLET_JS } from "@/lib/leaflet-bundle";
import { getTileBase64 } from "@/lib/tileCache";

function emojiFor(category: string) {
  return WAYPOINT_CATEGORIES.find((c) => c.key === category)?.emoji ?? "📍";
}

export function MapWebView({
  track,
  waypoints = [],
  height = 280,
}: {
  track: Point[];
  waypoints?: Waypoint[];
  height?: number;
}) {
  const ref = useRef<WebView>(null);
  const center = track[0] ?? [23.6, -102.5]; // centro de México por defecto
  const wps = waypoints.map((w) => ({ ...w, emoji: emojiFor(w.category) }));

  // Tiles offline: el mapa pide cada tile a RN; respondemos con el cacheado en
  // disco (base64) o, si no está, con la URL de red.
  async function onMessage(e: WebViewMessageEvent) {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type !== "getTile") return;
      const { z, x, y, id } = msg;
      const b64 = await getTileBase64(z, x, y);
      const src = b64
        ? `data:image/png;base64,${b64}`
        : `https://a.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png`;
      ref.current?.injectJavaScript(
        `window._tileReady(${JSON.stringify(id)}, ${JSON.stringify(src)}); true;`
      );
    } catch {
      // ignora errores de parseo
    }
  }

  const html = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
<style>${LEAFLET_CSS}</style>
<script>${LEAFLET_JS}</script>
<style>html,body,#map{height:100%;margin:0;background:#0C0D0F;}</style>
</head>
<body>
<div id="map"></div>
<script>
  var track = ${JSON.stringify(track)};
  var wps = ${JSON.stringify(wps)};

  var _pending = {};
  window._tileReady = function(id, src) {
    var cb = _pending[id];
    if (cb) { cb(src); delete _pending[id]; }
  };
  var OfflineTileLayer = L.TileLayer.extend({
    createTile: function(coords, done) {
      var img = document.createElement('img');
      img.setAttribute('role', 'presentation');
      var id = coords.z + '_' + coords.x + '_' + coords.y + '_' + Date.now();
      _pending[id] = function(src) { img.src = src; done(null, img); };
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'getTile', z: coords.z, x: coords.x, y: coords.y, id: id }));
      return img;
    }
  });

  var map = L.map('map', { scrollWheelZoom: false, attributionControl: true }).setView([${center[0]}, ${center[1]}], 13);
  new OfflineTileLayer('', { maxZoom: 20, attribution: '© OpenStreetMap © CARTO' }).addTo(map);
  if (track.length > 1) {
    var line = L.polyline(track, { color: '#F59E0B', weight: 4, opacity: 0.9 }).addTo(map);
    map.fitBounds(line.getBounds(), { padding: [30, 30] });
  }
  wps.forEach(function (w) {
    var icon = L.divIcon({
      className: '',
      html: '<span style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:9999px;background:#1A1D21;border:2px solid #F59E0B;font-size:14px;">' + w.emoji + '</span>',
      iconSize: [28, 28], iconAnchor: [14, 14]
    });
    L.marker([w.lat, w.lng], { icon: icon }).addTo(map).bindPopup('<b>' + (w.name || '') + '</b>');
  });
</script>
</body>
</html>`;

  return (
    <WebView
      ref={ref}
      originWhitelist={["*"]}
      source={{ html }}
      style={{ height, backgroundColor: "#0C0D0F" }}
      scrollEnabled={false}
      onMessage={onMessage}
    />
  );
}
