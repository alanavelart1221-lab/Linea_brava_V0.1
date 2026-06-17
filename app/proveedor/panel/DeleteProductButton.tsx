"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProduct } from "../actions";

export function DeleteProductButton({
  productId,
  providerId,
}: {
  productId: string;
  providerId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!confirm("¿Eliminar este producto?")) return;
    startTransition(async () => {
      await deleteProduct(productId, providerId);
      router.refresh();
    });
  }

  return (
    <button
      onClick={onDelete}
      disabled={pending}
      className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
    >
      {pending ? "…" : "Eliminar"}
    </button>
  );
}
