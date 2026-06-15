"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AdminActions({ routeId }: { routeId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function approve() {
    setLoading("approve");
    await supabase
      .from("user_routes")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", routeId);
    router.refresh();
    setLoading(null);
  }

  async function reject() {
    setLoading("reject");
    await supabase
      .from("user_routes")
      .update({ status: "rejected" })
      .eq("id", routeId);
    router.refresh();
    setLoading(null);
  }

  return (
    <div className="flex shrink-0 gap-2">
      <button
        onClick={approve}
        disabled={loading !== null}
        className="rounded-xl border border-go-500/40 bg-go-500/10 px-4 py-2 text-sm font-semibold text-go-400 transition-colors hover:bg-go-500/20 disabled:opacity-50"
      >
        {loading === "approve" ? "…" : "Aprobar"}
      </button>
      <button
        onClick={reject}
        disabled={loading !== null}
        className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
      >
        {loading === "reject" ? "…" : "Rechazar"}
      </button>
    </div>
  );
}
