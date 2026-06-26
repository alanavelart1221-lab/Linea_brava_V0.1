"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { togglePromocion } from "../actions";

export function TogglePromocionButton({
  promoId,
  providerId,
  activo,
}: {
  promoId: string;
  providerId: string;
  activo: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onToggle() {
    startTransition(async () => {
      await togglePromocion(promoId, providerId, !activo);
      router.refresh();
    });
  }

  return (
    <button
      onClick={onToggle}
      disabled={pending}
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
        activo
          ? "border-ink-600 bg-ink-900 text-mute hover:border-ink-400 hover:text-bone"
          : "border-go-500/40 bg-go-500/10 text-go-400 hover:bg-go-500/20"
      }`}
    >
      {pending ? "…" : activo ? "Desactivar" : "Activar"}
    </button>
  );
}
