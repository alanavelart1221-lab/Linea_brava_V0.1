import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "react-native";
import { supabase } from "./supabase";
import { extractVideoEmbed, getYouTubeThumbnail } from "./videoEmbed";

// Contenido destacado del Inicio: el post de comunidad con mejor engagement
// reciente, o el último video del canal de YouTube si no hay posts recientes.
// El resultado se cachea 2 horas en AsyncStorage (mismo mecanismo que offline.ts).

// TODO: reemplazar con el channel_id real del canal de YouTube de Línea Brava
// (se ve en la URL del canal o en youtube.com/account_advanced).
export const YOUTUBE_CHANNEL_ID = "CHANNEL_ID_PENDIENTE";

const CACHE_KEY = "lbv:destacado";
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 horas
const WINDOW_DAYS = 7;

export type DestacadoPost = {
  kind: "post";
  id: string;
  /** Cuerpo del post sin la URL de video (si la había). */
  text: string;
  authorName: string;
  authorAvatar: string | null;
  createdAt: string;
  likeCount: number;
  replyCount: number;
  /** Imagen de portada ya resuelta (foto del post o miniatura del video). */
  coverUrl: string | null;
  hasVideo: boolean;
};

export type DestacadoVideo = {
  kind: "youtube";
  videoId: string;
  title: string;
  channelName: string;
  publishedAt: string;
  coverUrl: string;
  watchUrl: string;
};

export type Destacado = DestacadoPost | DestacadoVideo;

type Cached = { at: number; item: Destacado };

// Caché en memoria para no releer AsyncStorage en cada foco de la pantalla.
let memoryCache: Cached | null = null;

/** puntaje = (likes + comentarios*2) / (horas_desde_publicacion + 2)^1.5 */
function engagementScore(likes: number, replies: number, createdAt: string): number {
  const hours = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / 3600000);
  return (likes + replies * 2) / Math.pow(hours + 2, 1.5);
}

type CountRel = { count: number }[];
type RawThread = {
  id: string;
  body: string | null;
  author_name: string;
  author_avatar: string | null;
  created_at: string;
  image_urls: string[] | null;
  replies?: CountRel;
  likes?: CountRel;
};

/** Post con mejor puntaje desde `sinceIso` (o histórico si se omite), o null. */
async function fetchTopPost(sinceIso?: string): Promise<DestacadoPost | null> {
  let query = supabase
    .from("forum_threads")
    .select(
      "id, body, author_name, author_avatar, created_at, image_urls, replies:forum_replies(count), likes:forum_thread_likes(count)"
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (sinceIso) query = query.gte("created_at", sinceIso);
  const { data, error } = await query;
  if (error) throw error;

  const rows = (data as RawThread[] | null) ?? [];
  if (rows.length === 0) return null;

  let best: DestacadoPost | null = null;
  let bestScore = -1;
  for (const row of rows) {
    const score = engagementScore(
      row.likes?.[0]?.count ?? 0,
      row.replies?.[0]?.count ?? 0,
      row.created_at
    );
    const { embedUrl, text } = extractVideoEmbed(row.body ?? "");
    // Portada: foto del post; si no hay, miniatura del video (solo YouTube
    // expone miniatura pública; para Vimeo queda el placeholder como excepción).
    const coverUrl =
      row.image_urls?.[0] ?? (embedUrl ? getYouTubeThumbnail(embedUrl) : null);
    // A igual puntaje (p. ej. todos en cero), gana el que sí tiene portada:
    // la tarjeta siempre debe mostrar una imagen real.
    const wins =
      score > bestScore || (score === bestScore && coverUrl !== null && best?.coverUrl == null);
    if (!wins) continue;
    bestScore = score;
    best = {
      kind: "post",
      id: row.id,
      text,
      authorName: row.author_name,
      authorAvatar: row.author_avatar ?? null,
      createdAt: row.created_at,
      likeCount: row.likes?.[0]?.count ?? 0,
      replyCount: row.replies?.[0]?.count ?? 0,
      coverUrl,
      hasVideo: embedUrl !== null,
    };
  }
  return best;
}

/** Primer valor capturado por la regex dentro del bloque, o null. */
function matchIn(block: string, re: RegExp): string | null {
  const m = block.match(re);
  return m ? m[1] : null;
}

/** Último video del canal vía el feed RSS público (sin API key). */
async function fetchLatestYouTubeVideo(): Promise<DestacadoVideo | null> {
  const res = await fetch(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`
  );
  if (!res.ok) throw new Error(`RSS ${res.status}`);
  const xml = await res.text();

  const entry = matchIn(xml, /<entry>([\s\S]*?)<\/entry>/);
  if (!entry) return null;

  const videoId = matchIn(entry, /<yt:videoId>([^<]+)<\/yt:videoId>/);
  if (!videoId) return null;
  const title = matchIn(entry, /<title>([^<]*)<\/title>/) ?? "Nuevo video";
  const publishedAt = matchIn(entry, /<published>([^<]+)<\/published>/) ?? new Date().toISOString();
  const channelName = matchIn(xml, /<author>[\s\S]*?<name>([^<]+)<\/name>/) ?? "Línea Brava";
  const coverUrl =
    matchIn(entry, /<media:thumbnail url="([^"]+)"/) ??
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  return {
    kind: "youtube",
    videoId,
    title,
    channelName,
    publishedAt,
    coverUrl,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

async function readStoredCache(): Promise<Cached | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Cached) : null;
  } catch {
    return null;
  }
}

/** Precarga la portada para que la tarjeta aparezca completa de golpe. */
async function prefetchCover(item: Destacado): Promise<void> {
  if (item.coverUrl) await Image.prefetch(item.coverUrl).catch(() => {});
}

/**
 * Devuelve el contenido destacado del Inicio.
 * - Usa la caché (memoria → AsyncStorage) si tiene menos de 2 horas.
 * - Si expiró, recalcula: mejor post de 7 días, o último video de YouTube.
 * - Si la red falla, devuelve la caché anterior aunque esté vencida.
 * - Devuelve null solo si no hay contenido ni caché (el Inicio muestra
 *   entonces la tarjeta de ruta de siempre).
 */
export async function getDestacado(): Promise<Destacado | null> {
  const stored = memoryCache ?? (await readStoredCache());
  if (stored) memoryCache = stored;
  if (stored && Date.now() - stored.at < CACHE_TTL_MS) {
    await prefetchCover(stored.item);
    return stored.item;
  }

  try {
    const since = new Date(Date.now() - WINDOW_DAYS * 86400000).toISOString();
    // Cadena de fallbacks: mejor post de 7 días → último video de YouTube →
    // mejor post histórico (mejor mostrar algo viejo que dejar vacío el Inicio).
    let item: Destacado | null = await fetchTopPost(since);
    if (!item) item = await fetchLatestYouTubeVideo().catch(() => null);
    if (!item) item = await fetchTopPost();
    if (!item) return stored?.item ?? null;
    await prefetchCover(item);
    const cached: Cached = { at: Date.now(), item };
    memoryCache = cached;
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cached)).catch(() => {});
    return item;
  } catch {
    // Sin red o error del feed: mejor contenido viejo que nada.
    return stored?.item ?? null;
  }
}
