"use client";

import { useEffect, useState } from "react";

function diff(target: number) {
  const now = Date.now();
  const d = Math.max(0, target - now);
  return {
    days: Math.floor(d / 86_400_000),
    hours: Math.floor((d / 3_600_000) % 24),
    minutes: Math.floor((d / 60_000) % 60),
    seconds: Math.floor((d / 1000) % 60),
  };
}

export function Countdown({ iso, compact = false }: { iso: string; compact?: boolean }) {
  const target = new Date(iso).getTime();
  // Start null so server and first client render match (avoids hydration drift).
  const [t, setT] = useState<ReturnType<typeof diff> | null>(null);

  useEffect(() => {
    setT(diff(target));
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const units: { label: string; value: number }[] = [
    { label: "Días", value: t?.days ?? 0 },
    { label: "Hrs", value: t?.hours ?? 0 },
    { label: "Min", value: t?.minutes ?? 0 },
    { label: "Seg", value: t?.seconds ?? 0 },
  ];

  return (
    <div
      className="flex items-stretch gap-2 sm:gap-3"
      role="timer"
      aria-label="Cuenta regresiva para la próxima rodada"
    >
      {units.map((u, i) => (
        <div key={u.label} className="flex items-stretch gap-2 sm:gap-3">
          <div
            className={`flex min-w-[3.5rem] flex-col items-center rounded-xl border border-ink-700 bg-ink-900/70 px-2 py-2 backdrop-blur-sm sm:min-w-[4.25rem] sm:py-2.5 ${
              compact ? "" : ""
            }`}
          >
            <span className="font-display text-3xl leading-none text-bone tabular-nums sm:text-4xl">
              {String(u.value).padStart(2, "0")}
            </span>
            <span className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-mute">
              {u.label}
            </span>
          </div>
          {i < units.length - 1 && (
            <span className="self-center font-display text-2xl text-trail-500/60">:</span>
          )}
        </div>
      ))}
    </div>
  );
}
