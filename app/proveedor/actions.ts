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
