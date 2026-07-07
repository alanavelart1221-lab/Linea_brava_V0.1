"use client";

import { useState, useTransition } from "react";

type Props = {
  initialCount: number;
  initialLiked: boolean;
  onToggle: () => Promise<void>;
};

export function LikeButton({ initialCount, initialLiked, onToggle }: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setLiked((prev) => !prev);
    setCount((prev) => (liked ? prev - 1 : prev + 1));
    startTransition(async () => {
      await onToggle();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
        liked
          ? "border-trail-500/60 bg-trail-500/10 text-trail-400"
          : "border-ink-600 text-mute hover:border-ink-400 hover:text-bone"
      }`}
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"}>
        <path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {count}
    </button>
  );
}
