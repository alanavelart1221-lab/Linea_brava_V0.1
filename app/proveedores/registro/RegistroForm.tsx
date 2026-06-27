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
          Revisaremos tu negocio. Cuando sea aprobado, activaremos tus 60 días de
          prueba y tu perfil aparecerá en el directorio.
        </p>
        <Link href="/proveedor/panel" className="btn-primary">
          Ir a mi panel
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-8">
      {state?.error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </p>
      )}

      {/* Datos del negocio */}
      <fieldset className="flex flex-col gap-6">
        <legend className="eyebrow mb-2">Datos del negocio</legend>

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

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-bone">Descripción *</span>
          <textarea name="description" required rows={5} maxLength={500} className="input-field resize-none" placeholder="¿Qué hace tu negocio y qué lo distingue?" />
        </label>
      </fieldset>

      {/* Contacto */}
      <fieldset className="flex flex-col gap-6">
        <legend className="eyebrow mb-2">Información de contacto</legend>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-bone">Teléfono *</span>
            <input name="phone" type="tel" required maxLength={40} className="input-field" placeholder="+52 81 1234 5678" />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-bone">
              WhatsApp <span className="font-normal text-mute">(opcional)</span>
            </span>
            <input name="whatsapp" type="tel" maxLength={40} className="input-field" placeholder="+52 81 1234 5678" />
          </label>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-bone">
              Correo <span className="font-normal text-mute">(opcional)</span>
            </span>
            <input name="email" type="email" maxLength={120} className="input-field" placeholder="contacto@tunegocio.mx" />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-bone">
              Sitio web <span className="font-normal text-mute">(opcional)</span>
            </span>
            <input name="website" type="url" className="input-field" placeholder="https://..." />
          </label>
        </div>
      </fieldset>

      {/* Ubicación */}
      <fieldset className="flex flex-col gap-6">
        <legend className="eyebrow mb-2">Ubicación</legend>

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
          <span className="text-sm font-semibold text-bone">
            Dirección <span className="font-normal text-mute">(opcional)</span>
          </span>
          <input name="address" type="text" maxLength={160} className="input-field" placeholder="Calle, número, colonia" />
        </label>
      </fieldset>

      {/* Especialidades, servicios y marcas */}
      <fieldset className="flex flex-col gap-6">
        <legend className="eyebrow mb-2">Especialidades, servicios y marcas</legend>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-bone">
            Especialidades <span className="font-normal text-mute">(separadas por coma)</span>
          </span>
          <input name="specialty" type="text" className="input-field" placeholder="Suspensión, Transmisión, Lift kits" />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-bone">
            Servicios <span className="font-normal text-mute">(separados por coma)</span>
          </span>
          <input name="servicios" type="text" className="input-field" placeholder="Alineación, Mantenimiento, Instalación de accesorios" />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-bone">
            Marcas que trabajas <span className="font-normal text-mute">(separadas por coma)</span>
          </span>
          <input name="marcas" type="text" className="input-field" placeholder="ARB, Fox, BFGoodrich, Warn" />
        </label>
      </fieldset>

      {/* Redes sociales */}
      <fieldset className="flex flex-col gap-6">
        <legend className="eyebrow mb-2">Redes sociales <span className="font-normal text-mute">(opcional)</span></legend>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-bone">Facebook</span>
            <input name="facebook" type="url" className="input-field" placeholder="https://facebook.com/..." />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-bone">Instagram</span>
            <input name="instagram" type="url" className="input-field" placeholder="https://instagram.com/..." />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-bone">TikTok</span>
            <input name="tiktok" type="url" className="input-field" placeholder="https://tiktok.com/@..." />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-bone">YouTube</span>
            <input name="youtube" type="url" className="input-field" placeholder="https://youtube.com/@..." />
          </label>
        </div>
      </fieldset>

      {/* Fotografías */}
      <fieldset className="flex flex-col gap-6">
        <legend className="eyebrow mb-2">Fotografías <span className="font-normal text-mute">(opcional)</span></legend>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-bone">Logo del negocio</span>
          <input name="logo" type="file" accept="image/*" className="input-field file:mr-3 file:rounded-full file:border-0 file:bg-trail-500/15 file:px-4 file:py-1 file:text-sm file:font-semibold file:text-trail-400" />
          <span className="text-xs text-mute">Una imagen, máximo 5 MB.</span>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-bone">Galería</span>
          <input name="gallery" type="file" accept="image/*" multiple className="input-field file:mr-3 file:rounded-full file:border-0 file:bg-trail-500/15 file:px-4 file:py-1 file:text-sm file:font-semibold file:text-trail-400" />
          <span className="text-xs text-mute">Hasta 6 imágenes, 5 MB cada una.</span>
        </label>
      </fieldset>

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn-primary disabled:opacity-50">
          {pending ? "Enviando…" : "Enviar solicitud"}
        </button>
        <Link href="/proveedores" className="btn-ghost">Cancelar</Link>
      </div>
    </form>
  );
}
