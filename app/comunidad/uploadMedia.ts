import { createClient } from "@/lib/supabase/client";

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_IMAGES = 4;

/**
 * Sube imágenes directo desde el navegador al bucket community-media.
 * Se hace client-side porque los server actions tienen límite de 1 MB de body.
 */
export async function uploadMedia(userId: string, files: File[]): Promise<string[]> {
  const supabase = createClient();
  const urls: string[] = [];
  for (const file of files) {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { data, error } = await supabase.storage
      .from("community-media")
      .upload(path, file, { contentType: file.type });
    if (error || !data) throw new Error("Error al subir la imagen.");
    const { data: { publicUrl } } = supabase.storage
      .from("community-media")
      .getPublicUrl(data.path);
    urls.push(publicUrl);
  }
  return urls;
}
