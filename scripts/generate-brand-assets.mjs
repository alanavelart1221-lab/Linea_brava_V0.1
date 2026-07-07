/**
 * Genera los assets PNG de la marca Línea Brava a partir de la geometría
 * canónica del logo (la misma de components/LogoMark.tsx y app/icon.svg).
 *
 * Uso: node scripts/generate-brand-assets.mjs
 * Usa `sharp` (ya presente en node_modules como dependencia de Next).
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const ORANGE = "#F5821F";
const INK = "#08090A";

// Geometría canónica: caja natural de la marca = 225 x 68
const MARK_W = 225;
const MARK_H = 68;
const MARK = `
  <g fill="none" stroke="${ORANGE}" stroke-width="6" stroke-linejoin="miter" stroke-linecap="butt">
    <polyline points="4,56 41,22 64.9,43.9 104,8 137.6,38.9 168,11 221,59.8"/>
  </g>`;

/** SVG cuadrado con la marca centrada. markRatio = ancho de la marca / lado. */
function squareSvg(size, markRatio, bg) {
  const scale = (size * markRatio) / MARK_W;
  const tx = (size - MARK_W * scale) / 2;
  const ty = (size - MARK_H * scale) / 2;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    ${bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ""}
    <g transform="translate(${tx},${ty}) scale(${scale})">${MARK}</g>
  </svg>`;
}

/** SVG con la proporción natural de la marca (fondo transparente). */
function wideSvg(width) {
  const height = Math.round((width * MARK_H) / MARK_W);
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${MARK_W} ${MARK_H}" xmlns="http://www.w3.org/2000/svg">${MARK}</svg>`;
}

const targets = [
  // Apple no respeta transparencia: fondo sólido
  { file: "app/apple-icon.png", svg: squareSvg(180, 0.72, INK) },
  // Ícono de app Expo
  { file: "mobile/assets/icon.png", svg: squareSvg(1024, 0.68, INK) },
  // Android adaptive icon: marca dentro de la zona segura central (~66%)
  { file: "mobile/assets/adaptive-icon.png", svg: squareSvg(1024, 0.62, null) },
  // Splash
  { file: "mobile/assets/splash-icon.png", svg: squareSvg(512, 0.8, null) },
  // Marca transparente para pantallas in-app (login, etc.)
  { file: "mobile/assets/brand/logo.png", svg: wideSvg(512) },
];

for (const { file, svg } of targets) {
  const out = path.join(root, file);
  await mkdir(path.dirname(out), { recursive: true });
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log("✓", file);
}
