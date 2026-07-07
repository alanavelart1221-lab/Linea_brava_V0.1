"use client";

import { createClient } from "@/lib/supabase/client";

type Props = {
  title: string;
  subtitle: string;
  next: string;
};

export function SignInCard({ title, subtitle, next }: Props) {
  async function signIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  return (
    <div className="rounded-2xl border border-ink-700 p-6 text-center">
      <p className="text-bone">{title}</p>
      <p className="mt-1 text-sm text-mute">{subtitle}</p>
      <button onClick={signIn} className="btn-primary mt-4">
        Entrar con Google
      </button>
    </div>
  );
}
