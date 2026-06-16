"use server";

import { createClient } from "@/lib/supabase/server";

const TYPES = ["taller", "distribuidor", "guia", "eventos", "equipo"];

export type SolicitudState = { error: string | null; success?: boolean } | null;

/**
 * Registra una solicitud de proveedor en estado 'pendiente'.
 * RLS exige que user_id sea el del usuario autenticado y que status sea
 * 'pendiente', así que un usuario no puede auto-aprobarse.
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
  const websiteRaw = (formData.get("website") as string)?.trim();
  const specialtyRaw = (formData.get("specialty") as string)?.trim();

  if (!name || !state || !city || !description || !phone) {
    return { error: "Completa todos los campos obligatorios." };
  }
  if (!TYPES.includes(type)) {
    return { error: "Selecciona un tipo de proveedor válido." };
  }

  const specialty = specialtyRaw
    ? specialtyRaw.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 8)
    : [];

  const { error } = await supabase.from("providers").insert({
    user_id: user.id,
    name,
    type,
    state,
    city,
    description,
    phone,
    website: websiteRaw || null,
    specialty,
    status: "pendiente",
  });

  if (error) return { error: "No se pudo enviar la solicitud. Intenta de nuevo." };

  return { error: null, success: true };
}
