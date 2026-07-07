"use client";

import { useTransition } from "react";
import { deletePost } from "../actions";

export function DeletePostButton({ postId }: { postId: string }) {
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!confirm("¿Eliminar esta publicación? Esta acción no se puede deshacer.")) return;
    startTransition(async () => {
      await deletePost(postId);
    });
  }

  return (
    <button
      onClick={onDelete}
      disabled={pending}
      className="text-xs font-semibold text-red-400/80 transition-colors hover:text-red-400 disabled:opacity-50"
    >
      {pending ? "Eliminando…" : "Eliminar publicación"}
    </button>
  );
}
