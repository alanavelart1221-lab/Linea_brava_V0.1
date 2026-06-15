"use client";

import { createClient } from "@/lib/supabase/client";

export function SignInPrompt() {
  async function signIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/foro/nuevo` },
    });
  }

  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border border-ink-700 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-ink-600 bg-ink-900">
        <svg className="h-8 w-8 text-trail-500" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div>
        <p className="font-display text-xl text-bone">Inicia sesión para publicar</p>
        <p className="mt-1 text-sm text-mute">
          Necesitas una cuenta para abrir hilos y participar en el foro.
        </p>
      </div>
      <button
        onClick={signIn}
        className="btn-primary mt-2"
      >
        Entrar con Google
      </button>
    </div>
  );
}
