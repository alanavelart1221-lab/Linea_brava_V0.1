"use client";

import { useActionState } from "react";
import { actualizarPerfil, type PerfilState } from "../actions";
import type { Provider } from "@/lib/providers";

export function PerfilForm({ provider }: { provider: Provider }) {
  const action = actualizarPerfil.bind(null, provider.id);
  const [state, formAction, pending] = useActionState<PerfilState, FormData>(
    action,
    null
  );

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {state?.error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-xl border border-go-500/30 bg-go-500/10 px-4 py-3 text-sm text-go-400">
          Perfil actualizado.
        </p>
      )}

      <fieldset className="flex flex-col gap-6">
        <legend className="eyebrow mb-2">Datos del negocio</legend>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-bone">Nombre del negocio *</span>
          <input name="name" type="text" required maxLength={120} defaultValue={provider.name} className="input-field" />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-bone">Descripción *</span>
          <textarea name="description" required rows={5} maxLength={500} defaultValue={provider.description} className="input-field resize-none" />
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-6">
        <legend className="eyebrow mb-2">Contacto</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-bone">Teléfono *</span>
            <input name="phone" type="tel" required maxLength={40} defaultValue={provider.phone} className="input-field" />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-bone">WhatsApp</span>
            <input name="whatsapp" type="tel" maxLength={40} defaultValue={provider.whatsapp ?? ""} className="input-field" />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-bone">Correo</span>
            <input name="email" type="email" maxLength={120} defaultValue={provider.email ?? ""} className="input-field" />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-bone">Sitio web</span>
            <input name="website" type="url" defaultValue={provider.website ?? ""} className="input-field" />
          </label>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-6">
        <legend className="eyebrow mb-2">Ubicación</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-bone">Estado *</span>
            <input name="state" type="text" required maxLength={60} defaultValue={provider.state} className="input-field" />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-bone">Ciudad *</span>
            <input name="city" type="text" required maxLength={60} defaultValue={provider.city} className="input-field" />
          </label>
        </div>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-bone">Dirección</span>
          <input name="address" type="text" maxLength={160} defaultValue={provider.address ?? ""} className="input-field" />
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-6">
        <legend className="eyebrow mb-2">Especialidades, servicios y marcas</legend>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-bone">
            Especialidades <span className="font-normal text-mute">(separadas por coma)</span>
          </span>
          <input name="specialty" type="text" defaultValue={provider.specialty.join(", ")} className="input-field" />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-bone">
            Servicios <span className="font-normal text-mute">(separados por coma)</span>
          </span>
          <input name="servicios" type="text" defaultValue={provider.servicios.join(", ")} className="input-field" />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-bone">
            Marcas <span className="font-normal text-mute">(separadas por coma)</span>
          </span>
          <input name="marcas" type="text" defaultValue={provider.marcas.join(", ")} className="input-field" />
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-6">
        <legend className="eyebrow mb-2">Redes sociales</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-bone">Facebook</span>
            <input name="facebook" type="url" defaultValue={provider.social.facebook ?? ""} className="input-field" />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-bone">Instagram</span>
            <input name="instagram" type="url" defaultValue={provider.social.instagram ?? ""} className="input-field" />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-bone">TikTok</span>
            <input name="tiktok" type="url" defaultValue={provider.social.tiktok ?? ""} className="input-field" />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-bone">YouTube</span>
            <input name="youtube" type="url" defaultValue={provider.social.youtube ?? ""} className="input-field" />
          </label>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="eyebrow mb-2">Logo</legend>
        <div className="flex items-center gap-4">
          {provider.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={provider.logo_url} alt="Logo" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-ink-800 text-xs text-mute/40">
              Sin logo
            </div>
          )}
          <label className="flex flex-1 flex-col gap-2">
            <span className="text-sm font-semibold text-bone">
              Reemplazar logo <span className="font-normal text-mute">(opcional, máx 5MB)</span>
            </span>
            <input name="logo" type="file" accept="image/*" className="input-field file:mr-3 file:rounded-full file:border-0 file:bg-trail-500/15 file:px-4 file:py-1 file:text-sm file:font-semibold file:text-trail-400" />
          </label>
        </div>
      </fieldset>

      <button type="submit" disabled={pending} className="btn-primary self-start disabled:opacity-50">
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
