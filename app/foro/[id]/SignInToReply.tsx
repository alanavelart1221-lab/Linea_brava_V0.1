"use client";

import { createClient } from "@/lib/supabase/client";

export function SignInToReply() {
  async function signIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="mt-8 rounded-2xl border border-ink-700 p-6 text-center">
      <p className="text-bone">¿Quieres responder?</p>
      <p className="mt-1 text-sm text-mute">Inicia sesión para participar en el foro.</p>
      <button onClick={signIn} className="btn-primary mt-4">
        Entrar con Google
      </button>
    </div>
  );
}
