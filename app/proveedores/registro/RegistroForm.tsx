"use client";

import { useActionState } from "react";
import Link from "next/link";
import { solicitarProveedor, type SolicitudState } from "../actions";
import { TYPE_META } from "@/lib/providers";
import type { ProviderType } from "@/lib/providers";

export function RegistroForm() {
  const [state, action, pending] = useActionState<SolicitudState, FormData>(
    solicitarProveedor,
    null
  );

  if (state?.success) {
    return (
      <div className="flex flex-col items-center gap-6 py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-go-500/15 text-4xl text-go-400">
          ✓
        </span>
        <h2 className="font-display text-3xl text-bone">Solicitud enviada</h2>
        <p className="max-w-sm text-mute">
          Revisaremos tu negocio y, una vez aprobado, aparecerá en el directorio de
          proveedores.
        </p>
        <Link href="/proveedores" className="btn-primary">
          Volver al directorio
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      {state?.error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </p>
      )}

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-bone">Nombre del negocio *</span>
        <input name="name" type="text" required maxLength={120} className="input-field" placeholder="Ej. TallerX4 Monterrey" />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-bone">Tipo de proveedor *</span>
        <select name="type" required defaultValue="" className="input-field">
          <option value="" disabled>Selecciona un tipo</option>
          {(Object.keys(TYPE_META) as ProviderType[]).map((t) => (
            <option key={t} value={t}>{TYPE_META[t].label}</option>
          ))}
        </select>
      </label>

      <div className="grid gap-6 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-bone">Estado *</span>
          <input name="state" type="text" required maxLength={60} className="input-field" placeholder="Ej. Nuevo León" />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-bone">Ciudad *</span>
          <input name="city" type="text" required maxLength={60} className="input-field" placeholder="Ej. Monterrey" />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-bone">Descripción *</span>
        <textarea name="description" required rows={5} maxLength={500} className="input-field resize-none" placeholder="¿Qué hace tu negocio y qué lo distingue?" />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-bone">
          Especialidades <span className="font-normal text-mute">(separadas por coma)</span>
        </span>
        <input name="specialty" type="text" className="input-field" placeholder="Suspensión, Transmisión, Lift kits" />
      </label>

      <div className="grid gap-6 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-bone">Teléfono *</span>
          <input name="phone" type="tel" required maxLength={40} className="input-field" placeholder="+52 81 1234 5678" />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-bone">
            Sitio web <span className="font-normal text-mute">(opcional)</span>
          </span>
          <input name="website" type="url" className="input-field" placeholder="https://..." />
        </label>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn-primary disabled:opacity-50">
          {pending ? "Enviando…" : "Enviar solicitud"}
        </button>
        <Link href="/proveedores" className="btn-ghost">Cancelar</Link>
      </div>
    </form>
  );
}
