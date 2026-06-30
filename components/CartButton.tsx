"use client";

import { useCart } from "./CartProvider";

export function CartButton() {
  const { totalItems, openDrawer } = useCart();

  return (
    <button
      onClick={openDrawer}
      aria-label={`Carrito (${totalItems} producto${totalItems !== 1 ? "s" : ""})`}
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-ink-700 text-mute transition-colors hover:border-ink-500 hover:text-bone"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {totalItems > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-trail-500 text-[10px] font-bold leading-none text-ink-950">
          {totalItems > 9 ? "9+" : totalItems}
        </span>
      )}
    </button>
  );
}
