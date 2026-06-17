"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Hace o quita admin a un usuario. La autorización real (solo superadmin) la
 * impone el RPC `set_admin` en Supabase; esto es la capa de UX.
 */
export async function setAdmin(
  targetId: string,
  makeAdmin: boolean
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_admin", {
    target: targetId,
    make_admin: makeAdmin,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/administradores");
  return { error: null };
}
