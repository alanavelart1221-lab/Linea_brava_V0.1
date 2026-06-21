"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AdminActions({
  routeId,
  calificada,
  oculta,
}: {
  routeId: string;
  calificada: boolean;
  oculta: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<"cal" | "hide" | null>(null);

  async function toggleCalificada() {
    setLoading("cal");
    await supabase
      .from("user_routes")
      .update({ calificada: !calificada })
      .eq("id", routeId);
    router.refresh();
    setLoading(null);
  }

  async function toggleHidden() {
    setLoading("hide");
    await supabase
      .from("user_routes")
      .update({ status: oculta ? "approved" : "oculta" })
      .eq("id", routeId);
    router.refresh();
    setLoading(null);
  }

  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      <Link
        href={`/rutas/comunidad/${routeId}`}
        className="rounded-xl border border-ink-600 bg-ink-900 px-4 py-2 text-sm font-semibold text-mute transition-colors hover:border-ink-400 hover:text-bone"
      >
        Ver
      </Link>
      <button
        onClick={toggleCalificada}
        disabled={loading !== null}
        className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
          calificada
            ? "border-ink-600 bg-ink-900 text-mute hover:border-ink-400 hover:text-bone"
            : "border-trail-500/50 bg-trail-500/10 text-trail-400 hover:bg-trail-500/20"
        }`}
      >
        {loading === "cal" ? "…" : calificada ? "Quitar calificada" : "Marcar calificada"}
      </button>
      <button
        onClick={toggleHidden}
        disabled={loading !== null}
        className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
          oculta
            ? "border-go-500/40 bg-go-500/10 text-go-400 hover:bg-go-500/20"
            : "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
        }`}
      >
        {loading === "hide" ? "…" : oculta ? "Reactivar" : "Ocultar"}
      </button>
    </div>
  );
}
