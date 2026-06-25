"use client";

import { useState } from "react";
import { PRECIO_SUSCRIPCION_MXN } from "@/lib/providers";

export function ActivarSuscripcionButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        Activar suscripción · ${PRECIO_SUSCRIPCION_MXN} MXN/mes
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="card-line max-w-sm p-7 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-2xl text-bone">Pago en camino</h3>
            <p className="mt-3 text-sm text-mute">
              Muy pronto podrás activar tu suscripción de ${PRECIO_SUSCRIPCION_MXN}{" "}
              MXN/mes con Stripe o Mercado Pago. Te avisaremos cuando esté listo.
            </p>
            <button onClick={() => setOpen(false)} className="btn-ghost mt-6">
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
