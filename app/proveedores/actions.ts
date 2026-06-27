"use server";

import { createClient } from "@/lib/supabase/server";

const TYPES = ["taller", "distribuidor", "guia", "eventos", "equipo"];
const MAX_IMG_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_GALLERY = 6;

export type SolicitudState = { error: string | null; success?: boolean } | null;

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

/** Sube un archivo al bucket provider-images y devuelve su URL pública. */
async function uploadImage(
  supabase: SupabaseServer,
  userId: string,
  file: File | null
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_IMG_BYTES) return null;
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { data, error } = await supabase.storage
    .from("provider-images")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error || !data) return null;
  const {
    data: { publicUrl },
  } = supabase.storage.from("provider-images").getPublicUrl(data.path);
  return publicUrl;
}

/** Divide un texto separado por comas en una lista limpia y acotada. */
function parseList(raw: string | undefined, max: number): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);
}

/**
 * Registra una solicitud de proveedor en estado 'pendiente'.
 * RLS exige que user_id sea el del usuario autenticado y que estado sea
 * 'pendiente' (o 'borrador'), así que un usuario no puede auto-aprobarse.
 */
export async function solicitarProveedor(
  _prev: SolicitudState,
  formData: FormData
): Promise<SolicitudState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión para enviar tu solicitud." };

  const name = (formData.get("name") as string)?.trim();
  const type = formData.get("type") as string;
  const state = (formData.get("state") as string)?.trim();
  const city = (formData.get("city") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const whatsapp = (formData.get("whatsapp") as string)?.trim();
  const address = (formData.get("address") as string)?.trim();
  const websiteRaw = (formData.get("website") as string)?.trim();

  if (!name || !state || !city || !description || !phone) {
    return { error: "Completa todos los campos obligatorios." };
  }
  if (!TYPES.includes(type)) {
    return { error: "Selecciona un tipo de proveedor válido." };
  }

  const specialty = parseList(formData.get("specialty") as string, 8);
  const servicios = parseList(formData.get("servicios") as string, 12);
  const marcas = parseList(formData.get("marcas") as string, 20);

  const social = {
    facebook: (formData.get("facebook") as string)?.trim() || undefined,
    instagram: (formData.get("instagram") as string)?.trim() || undefined,
    tiktok: (formData.get("tiktok") as string)?.trim() || undefined,
    youtube: (formData.get("youtube") as string)?.trim() || undefined,
  };

  // Imágenes: logo (1) y galería (hasta MAX_GALLERY).
  const logoUrl = await uploadImage(supabase, user.id, formData.get("logo") as File | null);

  const galleryFiles = (formData.getAll("gallery") as File[])
    .filter((f) => f && f.size > 0)
    .slice(0, MAX_GALLERY);
  const galleryUrls: string[] = [];
  for (const file of galleryFiles) {
    const url = await uploadImage(supabase, user.id, file);
    if (url) galleryUrls.push(url);
  }

  const { data: inserted, error } = await supabase
    .from("providers")
    .insert({
      user_id: user.id,
      name,
      type,
      state,
      city,
      description,
      phone,
      email: email || null,
      whatsapp: whatsapp || null,
      address: address || null,
      website: websiteRaw || null,
      specialty,
      servicios,
      marcas,
      social,
      logo_url: logoUrl,
      gallery: galleryUrls,
      estado: "pendiente",
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !inserted) {
    return { error: "No se pudo enviar la solicitud. Intenta de nuevo." };
  }

  // El aviso a los administradores lo dispara un trigger en `providers`
  // cuando el estado entra en 'pendiente' (no se llama nada desde el cliente).

  return { error: null, success: true };
}
