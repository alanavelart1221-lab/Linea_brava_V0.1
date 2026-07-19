import { View } from "react-native";
import Svg, { Circle, Polyline } from "react-native-svg";
import { colors } from "@/lib/theme";
import type { Point } from "@/lib/geo";

const VIEW_W = 300;
const VIEW_H = 110;
const PAD = 12;

/** Reduce el track a ~40 puntos para que el SVG sea ligero. */
function simplify(track: Point[], max = 40): Point[] {
  if (track.length <= max) return track;
  const step = (track.length - 1) / (max - 1);
  const out: Point[] = [];
  for (let i = 0; i < max; i++) out.push(track[Math.round(i * step)]);
  return out;
}

/**
 * Miniatura del recorrido GPS: escala los puntos [lat,lng] al viewBox y dibuja
 * la línea punteada con marcadores de inicio y fin. Sin mapa, solo el trazo.
 */
export default function TrackPreview({ track, height = 110 }: { track: Point[]; height?: number }) {
  if (track.length < 2) return <View style={{ height }} />;

  const pts = simplify(track);
  const lats = pts.map((p) => p[0]);
  const lngs = pts.map((p) => p[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const spanLat = maxLat - minLat || 1e-6;
  const spanLng = maxLng - minLng || 1e-6;

  // lng → x, lat → y (invertida: latitud mayor arriba).
  const scaled = pts.map(([lat, lng]) => {
    const x = PAD + ((lng - minLng) / spanLng) * (VIEW_W - PAD * 2);
    const y = PAD + ((maxLat - lat) / spanLat) * (VIEW_H - PAD * 2);
    return [x, y] as const;
  });

  const pointsAttr = scaled.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [startX, startY] = scaled[0];
  const [endX, endY] = scaled[scaled.length - 1];

  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMid meet">
      <Polyline
        points={pointsAttr}
        fill="none"
        stroke={colors.trail500}
        strokeWidth={2.5}
        strokeDasharray="6 5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={startX} cy={startY} r={4.5} fill={colors.trail500} />
      <Circle cx={endX} cy={endY} r={4.5} fill={colors.go500} />
    </Svg>
  );
}
