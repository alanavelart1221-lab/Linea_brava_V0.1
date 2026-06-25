"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProductState = { error: string | null; success?: boolean } | null;

async function uploadProductImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  file: File
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > 5 * 1024 * 1024) return null; // 5 MB máx
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage
    .from("provider-images")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error || !data) return null;
  const {
    data: { publicUrl },
  } = supabase.storage.from("provider-images").getPublicUrl(data.path);
  return publicUrl;
}

/**
 * Alta de un producto/accesorio en la tienda del proveedor.
 * La RLS de `provider_products` exige que el llamante sea el dueño del proveedor.
 */
export async function addProduct(
  providerId: string,
  _prev: ProductState,
  formData: FormData
): Promise<ProductState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "El nombre del producto es obligatorio." };

  const description = (formData.get("description") as string)?.trim() || null;

  const priceRaw = (formData.get("price") as string)?.trim();
  let price: number | null = null;
  if (priceRaw) {
    price = Number(priceRaw);
    if (Number.isNaN(price) || price < 0) return { error: "Precio inválido." };
  }

  const imageFile = formData.get("image") as File | null;
  const imageUrl =
    imageFile && imageFile.size > 0
      ? await uploadProductImage(supabase, user.id, imageFile)
      : null;

  const { error } = await supabase.from("provider_products").insert({
    provider_id: providerId,
    name,
    description,
    price,
    image_url: imageUrl,
  });

  if (error) return { error: "No se pudo guardar el producto. Intenta de nuevo." };

  revalidatePath("/proveedor/panel");
  revalidatePath(`/proveedores/${providerId}`);
  return { error: null, success: true };
}

export type PerfilState = { error: string | null; success?: boolean } | null;

function parseList(raw: string | undefined, max: number): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);
}

/**
 * Actualiza el perfil del propio proveedor (campos no privilegiados).
 * La RLS `providers_update_own` y el trigger `protect_provider_fields` impiden
 * tocar estado / featured / fechas de prueba.
 */
export async function actualizarPerfil(
  providerId: string,
  _prev: PerfilState,
  formData: FormData
): Promise<PerfilState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const name = (formData.get("name") as string)?.trim();
  const state = (formData.get("state") as string)?.trim();
  const city = (formData.get("city") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  if (!name || !state || !city || !description || !phone) {
    return { error: "Completa todos los campos obligatorios." };
  }

  const social = {
    facebook: (formData.get("facebook") as string)?.trim() || undefined,
    instagram: (formData.get("instagram") as string)?.trim() || undefined,
    tiktok: (formData.get("tiktok") as string)?.trim() || undefined,
    youtube: (formData.get("youtube") as string)?.trim() || undefined,
  };

  const logoFile = formData.get("logo") as File | null;
  const newLogoUrl =
    logoFile && logoFile.size > 0
      ? await uploadProductImage(supabase, user.id, logoFile)
      : null;

  const update: Record<string, unknown> = {
    name,
    state,
    city,
    description,
    phone,
    email: (formData.get("email") as string)?.trim() || null,
    whatsapp: (formData.get("whatsapp") as string)?.trim() || null,
    address: (formData.get("address") as string)?.trim() || null,
    website: (formData.get("website") as string)?.trim() || null,
    specialty: parseList(formData.get("specialty") as string, 8),
    servicios: parseList(formData.get("servicios") as string, 12),
    marcas: parseList(formData.get("marcas") as string, 20),
    social,
  };
  if (newLogoUrl) update.logo_url = newLogoUrl;

  const { error } = await supabase
    .from("providers")
    .update(update)
    .eq("id", providerId);

  if (error) return { error: "No se pudo guardar. Intenta de nuevo." };

  revalidatePath("/proveedor/panel");
  revalidatePath(`/proveedores/${providerId}`);
  return { error: null, success: true };
}

/**
 * Reenvía la solicitud a revisión (borrador / info_pendiente -> pendiente).
 * El trigger permite esta transición al dueño; vuelve a avisar a los admins.
 */
export async function reenviarSolicitud(
  providerId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const { error } = await supabase
    .from("providers")
    .update({ estado: "pendiente" })
    .eq("id", providerId);

  if (error) return { error: "No se pudo reenviar la solicitud." };

  // El aviso a los administradores lo dispara el trigger en `providers` al
  // volver el estado a 'pendiente'.

  revalidatePath("/proveedor/panel");
  return { error: null };
}

/** Borra un producto de la tienda. La RLS exige ser el dueño (o admin). */
export async function deleteProduct(
  productId: string,
  providerId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("provider_products")
    .delete()
    .eq("id", productId);
  if (error) return { error: "No se pudo eliminar." };

  revalidatePath("/proveedor/panel");
  revalidatePath(`/proveedores/${providerId}`);
  return { error: null };
}
