import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Rol = "usuario" | "proveedor" | "admin";

/** Devuelve el rol del usuario actual, o null si no hay sesión. */
export async function getRole(): Promise<Rol | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  return (data?.rol as Rol) ?? null;
}

/** true solo si el usuario actual es admin. */
export async function isAdmin(): Promise<boolean> {
  return (await getRole()) === "admin";
}

/**
 * Exige sesión de admin: si no, redirige a inicio.
 * Devuelve el cliente de Supabase y el usuario ya verificados para reusarlos.
 * La seguridad real la impone RLS en Supabase; esto es la capa de UX.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (data?.rol !== "admin") redirect("/");

  return { supabase, user };
}
