"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteThread, toggleThreadClosed } from "@/app/foro/actions";

export function ThreadModeration({
  threadId,
  closed,
}: {
  threadId: string;
  closed: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onToggleClosed() {
    startTransition(async () => {
      await toggleThreadClosed(threadId, !closed);
      router.refresh();
    });
  }

  function onDelete() {
    if (!confirm("¿Eliminar este hilo y todas sus respuestas?")) return;
    startTransition(async () => {
      await deleteThread(threadId);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[0.65rem] font-bold uppercase tracking-widest text-mute/60">
        Moderación
      </span>
      <button
        onClick={onToggleClosed}
        disabled={pending}
        className="rounded-lg border border-ink-600 bg-ink-900 px-3 py-1.5 text-xs font-semibold text-mute transition-colors hover:border-ink-400 hover:text-bone disabled:opacity-50"
      >
        {closed ? "Reabrir hilo" : "Cerrar hilo"}
      </button>
      <button
        onClick={onDelete}
        disabled={pending}
        className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
      >
        Borrar hilo
      </button>
    </div>
  );
}
