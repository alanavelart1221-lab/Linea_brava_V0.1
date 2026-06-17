"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteReply } from "@/app/foro/actions";

export function DeleteReplyButton({
  replyId,
  threadId,
}: {
  replyId: string;
  threadId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!confirm("¿Eliminar esta respuesta?")) return;
    startTransition(async () => {
      await deleteReply(replyId, threadId);
      router.refresh();
    });
  }

  return (
    <button
      onClick={onDelete}
      disabled={pending}
      className="text-xs font-semibold text-red-400/80 transition-colors hover:text-red-400 disabled:opacity-50"
    >
      {pending ? "…" : "Borrar"}
    </button>
  );
}
