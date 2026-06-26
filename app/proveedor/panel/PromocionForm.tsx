"use client";

import { useActionState, useEffect, useRef } from "react";
import { addPromocion, type PromocionState } from "../actions";

export function PromocionForm({ providerId }: { providerId: string }) {
  const action = addPromocion.bind(null, providerId);
  const [state, formAction, pending] = useActionState<PromocionState, FormData>(
    action,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state?.success]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5">
      {state?.error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-xl border border-go-500/30 bg-go-500/10 px-4 py-3 text-sm text-go-400">
          Promoción creada.
        </p>
      )}

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-bone">Título *</span>
        <input
          name="titulo"
          type="text"
          required
          maxLength={120}
          className="input-field"
          placeholder="Ej. Descuento de temporada"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-bone">
          Descuento <span className="font-normal text-mute">(opcional)</span>
        </span>
        <input
          name="descuento"
          type="text"
          maxLength={60}
          className="input-field"
          placeholder="Ej. 20%, 2x1, $500 de descuento"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-bone">
          Descripción <span className="font-normal text-mute">(opcional)</span>
        </span>
        <textarea
          name="descripcion"
          rows={3}
          maxLength={500}
          className="input-field resize-none"
          placeholder="Condiciones, qué incluye, etc."
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-bone">
            Desde <span className="font-normal text-mute">(opcional)</span>
          </span>
          <input name="fecha_inicio" type="date" className="input-field" />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-bone">
            Hasta <span className="font-normal text-mute">(opcional)</span>
          </span>
          <input name="fecha_fin" type="date" className="input-field" />
        </label>
      </div>

      <button type="submit" disabled={pending} className="btn-primary self-start disabled:opacity-50">
        {pending ? "Guardando…" : "Crear promoción"}
      </button>
    </form>
  );
}
