"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

const CATEGORIES = ["Mecánica", "Equipo", "Navegación", "Seguridad", "General"];

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
