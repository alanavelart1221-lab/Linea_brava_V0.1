/** Convierte una URL de YouTube/Vimeo en su URL de embed, o null si no lo es. */
export function getEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

const VIDEO_URL_RE =
  /https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/watch\?\S+|youtu\.be\/\S+|vimeo\.com\/\S+)/;

/**
 * Detecta la primera URL de YouTube/Vimeo dentro de un texto y la separa:
 * devuelve la URL de embed y el texto sin la URL cruda.
 */
export function extractVideoEmbed(body: string): {
  embedUrl: string | null;
  text: string;
} {
  const match = body.match(VIDEO_URL_RE);
  if (!match || match.index === undefined) return { embedUrl: null, text: body };

  const embedUrl = getEmbedUrl(match[0]);
  if (!embedUrl) return { embedUrl: null, text: body };

  const text = (
    body.slice(0, match.index) + body.slice(match.index + match[0].length)
  ).trim();
  return { embedUrl, text };
}
