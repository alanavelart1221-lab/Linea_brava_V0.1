"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { reenviarSolicitud } from "../actions";

export function ReenviarButton({ providerId }: { providerId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      await reenviarSolicitud(providerId);
      router.refresh();
    });
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="btn-primary disabled:opacity-50"
    >
      {pending ? "Enviando…" : "Reenviar a revisión"}
    </button>
  );
}
