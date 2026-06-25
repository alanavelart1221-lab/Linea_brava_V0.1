"use server";

import { createClient } from "@/lib/supabase/server";

export type CotizacionState = { error: string | null; success?: boolean } | null;

/**
 * Registra una solicitud de cotización para un proveedor.
 * La RLS exige usuario autenticado y que el proveedor esté en prueba o activo
 * (un proveedor suspendido deja de recibir cotizaciones).
 */
export async function solicitarCotizacion(
  providerId: string,
  _prev: CotizacionState,
  formData: FormData
): Promise<CotizacionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión para solicitar una cotización." };

  const nombre = (formData.get("nombre") as string)?.trim();
  const contacto = (formData.get("contacto") as string)?.trim();
  const mensaje = (formData.get("mensaje") as string)?.trim();

  if (!nombre || !contacto || !mensaje) {
    return { error: "Completa todos los campos." };
  }

  const { error } = await supabase.from("quote_requests").insert({
    provider_id: providerId,
    user_id: user.id,
    nombre,
    contacto,
    mensaje,
    estado: "nueva",
  });

  if (error) {
    return { error: "No se pudo enviar la solicitud. Intenta de nuevo." };
  }

  return { error: null, success: true };
}
