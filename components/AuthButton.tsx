"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { setModo, type Modo } from "@/app/proveedor/modo-actions";

function leerModo(): Modo | null {
  const m = document.cookie
    .split("; ")
    .find((c) => c.startsWith("lb_modo="))
    ?.split("=")[1];
  return m === "proveedor" || m === "usuario" ? m : null;
}

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [rol, setRol] = useState<string | null>(null);
  const [esProveedor, setEsProveedor] = useState(false);
  const [modo, setModoState] = useState<Modo>("usuario");
  const [loading, setLoading] = useState(true);
  const [pendingModo, startModo] = useTransition();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setRol(null);
      setEsProveedor(false);
      return;
    }
    supabase
      .from("profiles")
      .select("rol, estado_proveedor")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setRol((data?.rol as string) ?? null);
        const aprobado = data?.estado_proveedor === "aprobado";
        setEsProveedor(aprobado);
        // Proveedor aprobado sin preferencia previa: arranca en modo proveedor.
        const guardado = leerModo();
        if (aprobado && !guardado) {
          setModoState("proveedor");
          setModo("proveedor");
        } else if (guardado) {
          setModoState(guardado);
        }
      });
  }, [user]);

  function cambiarModo(nuevo: Modo) {
    setModoState(nuevo);
    startModo(async () => {
      await setModo(nuevo);
      router.refresh();
    });
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.refresh();
  }

  if (loading) {
    return <div className="h-9 w-24 animate-pulse rounded-full bg-ink-700" />;
  }

  if (!user) {
    return (
      <button
        onClick={signInWithGoogle}
        className="btn-primary !py-2 !px-5 text-sm"
      >
        Entrar con Google
      </button>
    );
  }

  const avatar = user.user_metadata?.avatar_url as string | undefined;
  const name = (user.user_metadata?.full_name as string | undefined)?.split(" ")[0];
  const esAdmin = rol === "admin" || rol === "superadmin";

  return (
    <div className="flex items-center gap-2">
      {esAdmin && (
        <Link
          href="/admin"
          className="rounded-full border border-trail-500/50 bg-trail-500/10 px-3 py-1.5 text-sm font-semibold text-trail-400 transition-colors hover:bg-trail-500/20"
        >
          Admin
        </Link>
      )}
      {esProveedor && (
        <button
          onClick={() =>
            cambiarModo(modo === "proveedor" ? "usuario" : "proveedor")
          }
          disabled={pendingModo}
          className="rounded-full border border-ink-700 bg-ink-900 px-3 py-1.5 text-sm font-medium text-mute transition-colors hover:border-ink-500 hover:text-bone disabled:opacity-50"
          title="Alternar entre tu panel de negocio y el sitio de usuario"
        >
          {modo === "proveedor" ? "Modo usuario" : "Modo proveedor"}
        </button>
      )}
      <Link
        href="/perfil"
        className="flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900 px-3 py-1.5 text-sm font-medium text-bone transition-colors hover:border-trail-500/50 hover:text-trail-400"
      >
        {avatar ? (
          <Image
            src={avatar}
            alt={name ?? "Avatar"}
            width={22}
            height={22}
            className="rounded-full"
          />
        ) : (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-trail-500 text-xs font-bold text-ink-950">
            {name?.[0]?.toUpperCase() ?? "U"}
          </span>
        )}
        <span className="hidden sm:block">{name ?? "Mi perfil"}</span>
      </Link>
      <button
        onClick={signOut}
        className="btn-ghost !py-2 !px-3 text-sm"
      >
        Salir
      </button>
    </div>
  );
}
