"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CATEGORIES = ["Mecánica", "Equipo", "Navegación", "Seguridad", "General"];

type Phase = "form" | "saved";

export function NuevoTipForm() {
  const [phase, setPhase] = useState<Phase>("form");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mediaType, setMediaType] = useState<"none" | "image" | "video">("none");

  const [form, setForm] = useState({
    title: "",
    category: "General",
    body: "",
    image_url: "",
    video_url: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.title.trim() || !form.body.trim()) {
      setError("El título y el contenido son obligatorios.");
      return;
    }

    setSaving(true);
    const { error: dbError } = await supabase.from("tips").insert({
      title: form.title.trim(),
      category: form.category,
      body: form.body.trim(),
      image_url: mediaType === "image" && form.image_url ? form.image_url.trim() : null,
      video_url: mediaType === "video" && form.video_url ? form.video_url.trim() : null,
    });
    setSaving(false);

    if (dbError) { setError(dbError.message); return; }
    setPhase("saved");
  }

  if (phase === "saved") {
    return (
      <div className="flex flex-col items-center gap-6 py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-go-500/15 text-4xl">✓</span>
        <h2 className="font-display text-3xl text-bone">Tip publicado</h2>
        <p className="max-w-sm text-mute">Ya está visible en la sección de tips.</p>
        <div className="flex gap-3">
          <Link href="/tips" className="btn-primary">Ver tips</Link>
          <button onClick={() => { setPhase("form"); setForm({ title: "", category: "General", body: "", image_url: "", video_url: "" }); setMediaType("none"); }} className="btn-ghost">
            Crear otro
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7">
      {/* Title */}
      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-bone">Título *</span>
        <input
          type="text"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Ej. Cómo calibrar la presión de llanta en roca"
          className="input-field"
          required
        />
      </label>

      {/* Category */}
      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-bone">Categoría</span>
        <select value={form.category} onChange={(e) => set("category", e.target.value)} className="input-field">
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>

      {/* Body */}
      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-bone">Contenido *</span>
        <textarea
          value={form.body}
          onChange={(e) => set("body", e.target.value)}
          rows={6}
          placeholder="Escribe el tip aquí..."
          className="input-field resize-none"
          required
        />
      </label>

      {/* Media toggle */}
      <div className="flex flex-col gap-3">
        <span className="text-sm font-semibold text-bone">Media (opcional)</span>
        <div className="flex gap-2">
          {(["none", "image", "video"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setMediaType(t)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                mediaType === t
                  ? "border-trail-500 bg-trail-500 text-ink-950"
                  : "border-ink-600 text-mute hover:border-ink-400 hover:text-bone"
              }`}
            >
              {t === "none" ? "Sin media" : t === "image" ? "Foto (URL)" : "Video (YouTube / Vimeo)"}
            </button>
          ))}
        </div>

        {mediaType === "image" && (
          <input
            type="url"
            value={form.image_url}
            onChange={(e) => set("image_url", e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="input-field"
          />
        )}
        {mediaType === "video" && (
          <input
            type="url"
            value={form.video_url}
            onChange={(e) => set("video_url", e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="input-field"
          />
        )}
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? "Publicando…" : "Publicar tip"}
        </button>
        <Link href="/tips" className="btn-ghost">Cancelar</Link>
      </div>
    </form>
  );
}
