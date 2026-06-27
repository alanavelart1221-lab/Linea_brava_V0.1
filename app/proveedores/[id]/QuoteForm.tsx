"use client";

import { useActionState } from "react";
import Link from "next/link";
import { solicitarCotizacion, type CotizacionState } from "./actions";

export function QuoteForm({
  providerId,
  isLoggedIn,
  defaultNombre,
  defaultContacto,
}: {
  providerId: string;
  isLoggedIn: boolean;
  defaultNombre: string;
  defaultContacto: string;
}) {
  const action = solicitarCotizacion.bind(null, providerId);
  const [state, formAction, pending] = useActionState<CotizacionState, FormData>(
    action,
    null
  );

  if (!isLoggedIn) {
    return (
      <div className="card-line p-6 text-center">
        <p className="text-sm text-mute">
          Inicia sesión para solicitar una cotización a este proveedor.
        </p>
        <Link href="/perfil" className="btn-primary mt-4 inline-block">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  if (state?.success) {
    return (
      <div className="card-line p-6 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-go-500/15 text-2xl text-go-400">
          ✓
        </span>
        <p className="mt-3 font-display text-xl text-bone">Solicitud enviada</p>
        <p className="mt-1 text-sm text-mute">
          El proveedor recibirá tu cotización y te contactará.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="card-line flex flex-col gap-4 p-6">
      <h3 className="font-display text-xl text-bone">Solicitar cotización</h3>
      {state?.error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </p>
      )}
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-bone">Tu nombre *</span>
        <input name="nombre" type="text" required maxLength={120} defaultValue={defaultNombre} className="input-field" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-bone">Correo o teléfono *</span>
        <input name="contacto" type="text" required maxLength={120} defaultValue={defaultContacto} className="input-field" placeholder="Para que te contacten" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-bone">¿Qué necesitas? *</span>
        <textarea name="mensaje" required rows={4} maxLength={600} className="input-field resize-none" placeholder="Describe el trabajo o producto que buscas." />
      </label>
      <button type="submit" disabled={pending} className="btn-primary disabled:opacity-50">
        {pending ? "Enviando…" : "Enviar solicitud"}
      </button>
    </form>
  );
}
