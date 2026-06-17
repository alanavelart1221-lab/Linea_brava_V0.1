import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Rol = "usuario" | "proveedor" | "admin" | "superadmin";

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

/** true si el usuario actual es admin o superadmin. */
export async function isAdmin(): Promise<boolean> {
  const rol = await getRole();
  return rol === "admin" || rol === "superadmin";
}

/** true solo si el usuario actual es superadmin. */
export async function isSuperadmin(): Promise<boolean> {
  return (await getRole()) === "superadmin";
}

/**
 * Exige sesión de admin (o superadmin): si no, redirige a inicio.
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

  if (data?.rol !== "admin" && data?.rol !== "superadmin") redirect("/");

  return { supabase, user, rol: data?.rol as Rol };
}

/**
 * Exige sesión de superadmin: si no, redirige a inicio.
 * Misma forma que requireAdmin().
 */
export async function requireSuperadmin() {
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

  if (data?.rol !== "superadmin") redirect("/");

  return { supabase, user };
}
