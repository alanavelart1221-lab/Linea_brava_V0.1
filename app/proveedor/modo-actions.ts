"use server";

import { cookies } from "next/headers";

export type Modo = "proveedor" | "usuario";

/**
 * Guarda la preferencia de vista del proveedor (cookie `lb_modo`).
 * Es solo UI: no cambia el rol ni los permisos. Un proveedor aprobado puede
 * alternar entre su panel de negocio y el sitio normal de usuario.
 */
export async function setModo(modo: Modo): Promise<void> {
  const store = await cookies();
  store.set("lb_modo", modo, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
