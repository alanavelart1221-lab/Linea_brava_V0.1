"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

const CATEGORIES = ["Mecánica", "Equipo", "Navegación", "Seguridad", "General"];

// Límite de caracteres de un post del feed de comunidad (mismo MAX_BODY de comunidad/actions.ts).
const MAX_POST_BODY = 500;

export type PublicarTipInput = {
  title: string;
  category: string;
  body: string;
  image_url: string | null;
  video_url: string | null;
};

/**
 * Publica un tip. El control de admin vive del lado servidor (requireAdmin)
 * y además lo refuerza RLS en Supabase.
 */
export async function publicarTip(
  input: PublicarTipInput
): Promise<{ error: string | null }> {
  const { supabase } = await requireAdmin();

  const title = input.title?.trim();
  const body = input.body?.trim();
  const category = CATEGORIES.includes(input.category) ? input.category : "General";

  if (!title || !body) {
    return { error: "El título y el contenido son obligatorios." };
  }

  const { error } = await supabase.from("tips").insert({
    title,
    category,
    body,
    image_url: input.image_url?.trim() || null,
    video_url: input.video_url?.trim() || null,
  });

  if (error) return { error: "No se pudo publicar el tip. Intenta de nuevo." };

  revalidatePath("/tips");
  return { error: null };
}

/**
 * Publica un tip existente como post en el feed de comunidad,
 * a nombre del admin que lo sube.
 */
export async function subirTipAComunidad(
  tipId: string
): Promise<{ error: string | null }> {
  const { supabase, user } = await requireAdmin();

  const { data: tip } = await supabase
    .from("tips")
    .select("title, body, image_url, video_url")
    .eq("id", tipId)
    .single();

  if (!tip) return { error: "No se encontró el tip." };

  // El video va al final del body; el feed lo detecta y lo muestra embebido.
  const suffix = tip.video_url ? `\n\n${tip.video_url.trim()}` : "";
  let text = `${tip.title}\n\n${tip.body}`.trim();
  const available = MAX_POST_BODY - suffix.length;
  if (text.length > available) {
    text = `${text.slice(0, available - 1).trimEnd()}…`;
  }

  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Miembro";
  const avatar = (user.user_metadata?.avatar_url as string | undefined) ?? null;

  const { error } = await supabase.from("forum_threads").insert({
    user_id: user.id,
    body: text + suffix,
    author_name: name,
    author_avatar: avatar,
    image_urls: tip.image_url ? [tip.image_url] : [],
  });

  if (error) return { error: "No se pudo publicar en comunidad. Intenta de nuevo." };

  revalidatePath("/comunidad");
  return { error: null };
}
