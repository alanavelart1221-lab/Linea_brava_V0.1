"use client";

import { useActionState, useEffect, useRef } from "react";
import { addProduct, type ProductState } from "../actions";

export function ProductForm({ providerId }: { providerId: string }) {
  const action = addProduct.bind(null, providerId);
  const [state, formAction, pending] = useActionState<ProductState, FormData>(
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
          Producto agregado.
        </p>
      )}

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-bone">Nombre del producto *</span>
        <input
          name="name"
          type="text"
          required
          maxLength={120}
          className="input-field"
          placeholder="Ej. Suspensión 2'' Old Man Emu"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-bone">
          Descripción <span className="font-normal text-mute">(opcional)</span>
        </span>
        <textarea
          name="description"
          rows={3}
          maxLength={500}
          className="input-field resize-none"
          placeholder="Detalles, compatibilidad, etc."
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-bone">
            Precio (MXN) <span className="font-normal text-mute">(opcional)</span>
          </span>
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            className="input-field"
            placeholder="Ej. 12500"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-bone">
            Foto <span className="font-normal text-mute">(opcional, máx 5MB)</span>
          </span>
          <input
            name="image"
            type="file"
            accept="image/*"
            className="input-field file:mr-3 file:rounded-full file:border-0 file:bg-ink-700 file:px-3 file:py-1 file:text-sm file:text-bone"
          />
        </label>
      </div>

      <button type="submit" disabled={pending} className="btn-primary self-start disabled:opacity-50">
        {pending ? "Guardando…" : "Agregar producto"}
      </button>
    </form>
  );
}
