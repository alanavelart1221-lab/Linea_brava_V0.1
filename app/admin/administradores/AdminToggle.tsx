"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setAdmin } from "./actions";

export function AdminToggle({
  userId,
  isAdmin,
}: {
  userId: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    setError(null);
    startTransition(async () => {
      const { error } = await setAdmin(userId, !isAdmin);
      if (error) {
        setError(error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        onClick={toggle}
        disabled={pending}
        className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
          isAdmin
            ? "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
            : "border-go-500/40 bg-go-500/10 text-go-400 hover:bg-go-500/20"
        }`}
      >
        {pending ? "…" : isAdmin ? "Quitar admin" : "Hacer admin"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
