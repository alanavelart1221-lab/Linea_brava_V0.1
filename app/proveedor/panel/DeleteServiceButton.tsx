"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteService } from "../actions";

export function DeleteServiceButton({
  serviceId,
  providerId,
}: {
  serviceId: string;
  providerId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!confirm("¿Eliminar este servicio?")) return;
    startTransition(async () => {
      await deleteService(serviceId, providerId);
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
