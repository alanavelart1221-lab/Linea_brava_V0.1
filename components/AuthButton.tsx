"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="flex items-center gap-2">
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
