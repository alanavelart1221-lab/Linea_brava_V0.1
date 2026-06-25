"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ProviderEstado } from "@/lib/providers";

type Accion = "approve" | "reject" | "info" | "suspend" | "reactivate";

export function SolicitudActions({
  providerId,
  estado,
}: {
  providerId: string;
  estado: ProviderEstado;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<Accion | null>(null);

  async function run(accion: Accion, fn: () => PromiseLike<unknown>) {
    setLoading(accion);
    await fn();
    router.refresh();
    setLoading(null);
  }

  const approve = () =>
    run("approve", () => supabase.rpc("approve_provider", { p_provider_id: providerId }));

  const reject = () => {
    const reason = window.prompt("Motivo del rechazo (opcional):") ?? "";
    return run("reject", () =>
      supabase.rpc("reject_provider", { p_provider_id: providerId, p_reason: reason })
    );
  };

  const requestInfo = () => {
    const message = window.prompt("¿Qué información necesitas del proveedor?");
    if (message == null) return; // canceló
    return run("info", () =>
      supabase.rpc("request_provider_info", { p_provider_id: providerId, p_message: message })
    );
  };

  const suspend = () => {
    if (!window.confirm("¿Suspender a este proveedor? Dejará de aparecer públicamente.")) return;
    return run("suspend", () => supabase.rpc("suspend_provider", { p_provider_id: providerId }));
  };

  const reactivate = () =>
    run("reactivate", () => supabase.rpc("reactivate_provider", { p_provider_id: providerId }));

  const puedeAprobar = estado !== "en_prueba" && estado !== "activo";
  const puedePedirInfo = estado === "pendiente" || estado === "info_pendiente" || estado === "rechazado";
  const puedeRechazar = estado !== "rechazado";
  const puedeSuspender = estado === "en_prueba" || estado === "activo";
  const puedeReactivar = estado === "suspendido";
  const busy = loading !== null;

  return (
    <div className="flex shrink-0 flex-col gap-2">
      {puedeAprobar && (
        <Btn tone="go" onClick={approve} loading={loading === "approve"} busy={busy}>
          Aprobar
        </Btn>
      )}
      {puedeReactivar && (
        <Btn tone="go" onClick={reactivate} loading={loading === "reactivate"} busy={busy}>
          Reactivar
        </Btn>
      )}
      {puedePedirInfo && (
        <Btn tone="amber" onClick={requestInfo} loading={loading === "info"} busy={busy}>
          Solicitar información
        </Btn>
      )}
      {puedeSuspender && (
        <Btn tone="amber" onClick={suspend} loading={loading === "suspend"} busy={busy}>
          Suspender
        </Btn>
      )}
      {puedeRechazar && (
        <Btn tone="red" onClick={reject} loading={loading === "reject"} busy={busy}>
          Rechazar
        </Btn>
      )}
    </div>
  );
}

function Btn({
  tone,
  onClick,
  loading,
  busy,
  children,
}: {
  tone: "go" | "amber" | "red";
  onClick: () => void;
  loading: boolean;
  busy: boolean;
  children: React.ReactNode;
}) {
  const clase =
    tone === "go"
      ? "border-go-500/40 bg-go-500/10 text-go-400 hover:bg-go-500/20"
      : tone === "amber"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
      : "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20";
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${clase}`}
    >
      {loading ? "…" : children}
    </button>
  );
}
