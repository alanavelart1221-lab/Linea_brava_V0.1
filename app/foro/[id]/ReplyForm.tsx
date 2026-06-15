"use client";

import { useActionState, useEffect, useRef, useState } from "react";

type State = { error: string | null; success?: boolean } | null;

type Props = {
  onSubmit: (_prev: State, formData: FormData) => Promise<State>;
};

export function ReplyForm({ onSubmit }: Props) {
  const [state, action, pending] = useActionState<State, FormData>(onSubmit, null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setPreview(null);
    }
  }, [state]);

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
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      {state?.error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-xl border border-trail-500/30 bg-trail-500/10 px-4 py-3 text-sm text-trail-400">
          Respuesta publicada.
        </p>
      )}
      <textarea
        name="body"
        required
        rows={4}
        placeholder="Escribe tu respuesta..."
        className="w-full resize-y rounded-xl border border-ink-600 bg-ink-900 px-4 py-3 text-bone placeholder:text-mute focus:border-trail-500 focus:outline-none"
      />

      {/* Image upload */}
      <input
        ref={fileRef}
        name="image"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFile}
        className="hidden"
      />
      {preview ? (
        <div className="relative overflow-hidden rounded-xl border border-ink-600">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Vista previa" className="max-h-48 w-full object-cover" />
          <button
            type="button"
            onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink-950/80 text-xs text-bone backdrop-blur-sm hover:bg-ink-800"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 text-sm text-mute hover:text-trail-400"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
            <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
            <polyline points="21 15 16 10 5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Adjuntar foto
        </button>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-trail-500 px-7 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-trail-400 disabled:opacity-50"
        >
          {pending ? "Enviando..." : "Responder"}
        </button>
      </div>
    </form>
  );
}
