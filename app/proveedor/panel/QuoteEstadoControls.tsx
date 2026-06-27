"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setQuoteEstado } from "../actions";
import type { QuoteEstado } from "@/lib/providers";

export function QuoteEstadoControls({
  quoteId,
  estado,
}: {
  quoteId: string;
  estado: QuoteEstado;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function update(next: QuoteEstado) {
    startTransition(async () => {
      await setQuoteEstado(quoteId, next);
      router.refresh();
    });
  }

  return (
    <div className="flex shrink-0 gap-2">
      {estado !== "atendida" && (
        <button
          onClick={() => update("atendida")}
          disabled={pending}
          className="rounded-lg border border-go-500/40 bg-go-500/10 px-3 py-1.5 text-xs font-semibold text-go-400 transition-colors hover:bg-go-500/20 disabled:opacity-50"
        >
          Marcar atendida
        </button>
      )}
      {estado !== "descartada" && (
        <button
          onClick={() => update("descartada")}
          disabled={pending}
          className="rounded-lg border border-ink-600 bg-ink-900 px-3 py-1.5 text-xs font-semibold text-mute transition-colors hover:border-ink-400 hover:text-bone disabled:opacity-50"
        >
          Descartar
        </button>
      )}
      {estado !== "nueva" && (
        <button
          onClick={() => update("nueva")}
          disabled={pending}
          className="rounded-lg border border-ink-600 bg-ink-900 px-3 py-1.5 text-xs font-semibold text-mute transition-colors hover:border-ink-400 hover:text-bone disabled:opacity-50"
        >
          Reabrir
        </button>
      )}
    </div>
  );
}
