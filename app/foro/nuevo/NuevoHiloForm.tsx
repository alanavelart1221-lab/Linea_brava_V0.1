"use client";

import { useActionState, useState, useRef } from "react";
import { createThread } from "@/app/foro/actions";

const CATEGORIES = ["Rutas", "Mecánica", "Overland & Equipo", "General"] as const;

type State = { error: string | null; success?: boolean } | null;

export function NuevoHiloForm() {
  const [state, action, pending] = useActionState<State, FormData>(createThread, null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) { setPreview(null); return; }
    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen no puede pesar más de 5 MB.");
      e.target.value = "";
      setPreview(null);
      return;
    }
    setPreview(URL.createObjectURL(file));
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      {state?.error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="category" className="text-sm font-semibold text-bone">
          Categoría
        </label>
        <select
          id="category"
          name="category"
          required
          defaultValue=""
          className="w-full rounded-xl border border-ink-600 bg-ink-900 px-4 py-3 text-bone focus:border-trail-500 focus:outline-none"
        >
          <option value="" disabled>Selecciona una categoría</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="text-sm font-semibold text-bone">
          Título
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={150}
          placeholder="Ej. ¿Cuál es la mejor ruta en Baja?"
          className="w-full rounded-xl border border-ink-600 bg-ink-900 px-4 py-3 text-bone placeholder:text-mute focus:border-trail-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="body" className="text-sm font-semibold text-bone">
          Mensaje
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={8}
          placeholder="Escribe tu pregunta o tema de conversación..."
          className="w-full resize-y rounded-xl border border-ink-600 bg-ink-900 px-4 py-3 text-bone placeholder:text-mute focus:border-trail-500 focus:outline-none"
        />
      </div>

      {/* Image upload */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-bone">
          Foto <span className="font-normal text-mute">(opcional · máx. 5 MB)</span>
        </label>
        <input
          ref={fileRef}
          id="image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFile}
          className="hidden"
        />
        {preview ? (
          <div className="relative overflow-hidden rounded-xl border border-ink-600">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Vista previa" className="max-h-72 w-full object-cover" />
            <button
              type="button"
              onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-ink-950/80 text-bone backdrop-blur-sm hover:bg-ink-800"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-ink-600 py-8 text-mute transition-colors hover:border-trail-500 hover:text-trail-400"
          >
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="text-sm">Subir foto</span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-end gap-4">
        <a href="/foro" className="text-sm text-mute hover:text-bone">Cancelar</a>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-trail-500 px-8 py-3 text-sm font-semibold text-ink-950 transition-colors hover:bg-trail-400 disabled:opacity-50"
        >
          {pending ? "Publicando..." : "Publicar hilo"}
        </button>
      </div>
    </form>
  );
}
