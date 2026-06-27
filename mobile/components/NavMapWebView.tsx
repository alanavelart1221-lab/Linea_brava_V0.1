import { useEffect, useMemo, useRef } from "react";
import { WebView } from "react-native-webview";
import type { WebViewMessageEvent } from "react-native-webview";
import { WAYPOINT_CATEGORIES, type Waypoint } from "@/lib/activities";
import type { Point } from "@/lib/geo";
import { LEAFLET_CSS, LEAFLET_JS } from "@/lib/leaflet-bundle";
import { getTileBase64 } from "@/lib/tileCache";

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
  startPoint,
  endPoint,
  guideTo,
}: {
  routeTrack: Point[];
  waypoints?: Waypoint[];
  userTrack: Point[];
  position: Point | null;
  height?: number;
  userColor?: string;
  markerColor?: string;
  startPoint?: Point | null;
  endPoint?: Point | null;
  guideTo?: Point | null;
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

  // El mapa pide cada tile por postMessage; respondemos con el tile cacheado en
  // disco (base64) o, si no está, con la URL de red (cae a online cuando hay señal).
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

  const html = useMemo(
    () => `<!DOCTYPE html>
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
  var routeTrack = ${JSON.stringify(routeTrack)};
  var wps = ${JSON.stringify(wps)};
  var userColor = ${JSON.stringify(userColor)};
  var dotColor = ${JSON.stringify(dotColor)};
  var startPoint = ${JSON.stringify(startPoint ?? null)};
  var endPoint = ${JSON.stringify(endPoint ?? null)};

  // Capa de tiles offline: cada tile se pide a React Native (caché en disco) y,
  // si no está, cae a la red. Así el fondo del mapa se ve sin internet.
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

  var map = L.map('map', { attributionControl: true }).setView([${center[0]}, ${center[1]}], 14);
  new OfflineTileLayer('', { maxZoom: 20, attribution: '© OpenStreetMap © CARTO' }).addTo(map);

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

  if (startPoint) {
    var startIcon = L.divIcon({
      className: '',
      html: '<span style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9999px;background:#10B981;border:3px solid #0B0C0E;color:#0B0C0E;font-size:13px;font-weight:800;">▶</span>',
      iconSize: [30, 30], iconAnchor: [15, 15]
    });
    L.marker(startPoint, { icon: startIcon }).addTo(map).bindPopup('<b>Inicio</b>');
  }
  if (endPoint) {
    var endIcon = L.divIcon({
      className: '',
      html: '<span style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9999px;background:#1A1D21;border:2px solid #F59E0B;font-size:15px;">🏁</span>',
      iconSize: [30, 30], iconAnchor: [15, 15]
    });
    L.marker(endPoint, { icon: endIcon }).addTo(map).bindPopup('<b>Fin</b>');
  }

  var userLine = L.polyline([], { color: userColor, weight: 5, opacity: 0.95 }).addTo(map);
  var guideLine = L.polyline([], { color: '#F59E0B', weight: 3, opacity: 0.8, dashArray: '8, 10' }).addTo(map);
  var posMarker = null;

  window.setUser = function (t) { userLine.setLatLngs(t); };
  window.setGuide = function (from, to) {
    guideLine.setLatLngs(from && to ? [from, to] : []);
  };
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
    // El HTML solo depende de la ruta a seguir, los marcadores fijos y el color
    // del usuario; el trazo, la posición y la línea guía se inyectan en vivo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      JSON.stringify(routeTrack),
      JSON.stringify(wps),
      userColor,
      dotColor,
      JSON.stringify(startPoint ?? null),
      JSON.stringify(endPoint ?? null),
    ]
  );

  function pushLive() {
    if (!ready.current) return;
    const guide =
      guideTo && position
        ? `if(window.setGuide){window.setGuide(${JSON.stringify(position)},${JSON.stringify(guideTo)});}`
        : `if(window.setGuide){window.setGuide(null,null);}`;
    ref.current?.injectJavaScript(
      `if(window.setUser){window.setUser(${JSON.stringify(userTrack)});}` +
        (position ? `if(window.setPosition){window.setPosition(${position[0]},${position[1]});}` : "") +
        guide +
        `true;`
    );
  }

  useEffect(() => {
    pushLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userTrack, position, guideTo]);

  return (
    <WebView
      ref={ref}
      originWhitelist={["*"]}
      source={{ html }}
      style={height ? { height, backgroundColor: "#0C0D0F" } : { flex: 1, backgroundColor: "#0C0D0F" }}
      onMessage={onMessage}
      onLoadEnd={() => {
        ready.current = true;
        pushLive();
      }}
    />
  );
}
