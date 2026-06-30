"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCart } from "./CartProvider";

function fmtMxn(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function CartDrawer() {
  const { drawerOpen, closeDrawer, groups, items, totalMxn, updateQty, removeItem } = useCart();

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-ink-950/70 backdrop-blur-sm"
            onClick={closeDrawer}
          />

          {/* Drawer */}
          <motion.aside
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-ink-700 bg-ink-900 shadow-lift"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink-700 px-6 py-4">
              <h2 className="font-display text-2xl tracking-tightest text-bone">
                CARRITO
              </h2>
              <button
                onClick={closeDrawer}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-700 text-mute transition-colors hover:border-ink-500 hover:text-bone"
                aria-label="Cerrar carrito"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                  <p className="text-4xl">🛒</p>
                  <p className="text-sm text-mute">Tu carrito está vacío</p>
                  <Link
                    href="/marketplace"
                    onClick={closeDrawer}
                    className="btn-ghost text-sm"
                  >
                    Ver marketplace
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {groups.map((group) => (
                    <div key={group.providerId} className="flex flex-col gap-3">
                      <p className="eyebrow text-xs">{group.providerName}</p>

                      {group.items.map((item) => (
                        <div
                          key={item.productId}
                          className="flex gap-4 rounded-xl border border-ink-700 bg-ink-800/50 p-3"
                        >
                          {/* Imagen */}
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-700">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-2xl">
                                📦
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex flex-1 flex-col gap-1">
                            <p className="text-sm font-medium text-bone line-clamp-2">
                              {item.name}
                            </p>
                            <p className="font-display text-lg text-trail-400">
                              {fmtMxn(item.price)}
                            </p>

                            {/* Cantidad */}
                            <div className="mt-1 flex items-center gap-2">
                              <button
                                onClick={() => updateQty(item.productId, item.quantity - 1)}
                                className="flex h-7 w-7 items-center justify-center rounded-full border border-ink-600 text-sm text-mute hover:border-trail-500 hover:text-trail-400"
                                aria-label="Reducir cantidad"
                              >
                                −
                              </button>
                              <span className="w-5 text-center text-sm text-bone">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQty(item.productId, item.quantity + 1)}
                                className="flex h-7 w-7 items-center justify-center rounded-full border border-ink-600 text-sm text-mute hover:border-trail-500 hover:text-trail-400"
                                aria-label="Aumentar cantidad"
                              >
                                +
                              </button>
                              <button
                                onClick={() => removeItem(item.productId)}
                                className="ml-auto text-xs text-mute hover:text-red-400"
                                aria-label="Eliminar producto"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      <p className="text-right text-sm text-mute">
                        Subtotal {group.providerName}:{" "}
                        <span className="text-bone">{fmtMxn(group.subtotal)}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-ink-700 px-6 py-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-mute">Total</span>
                  <span className="font-display text-2xl text-trail-400">
                    {fmtMxn(totalMxn)}
                  </span>
                </div>
                <Link
                  href="/checkout"
                  onClick={closeDrawer}
                  className="btn-primary w-full justify-center"
                >
                  Ir al checkout
                </Link>
                <button
                  onClick={closeDrawer}
                  className="mt-3 w-full text-center text-sm text-mute hover:text-bone"
                >
                  Seguir comprando
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
