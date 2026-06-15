"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Link from "next/link";

type Phase = "loading" | "auth" | "form" | "submitted";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MEXICAN_STATES = [
  "Aguascalientes","Baja California","Baja California Sur","Campeche","Chiapas",
  "Chihuahua","Ciudad de México","Coahuila","Colima","Durango","Estado de México",
  "Guanajuato","Guerrero","Hidalgo","Jalisco","Michoacán","Morelos","Nayarit",
  "Nuevo León","Oaxaca","Puebla","Querétaro","Quintana Roo","San Luis Potosí",
  "Sinaloa","Sonora","Tabasco","Tamaulipas","Tlaxcala","Veracruz","Yucatán","Zacatecas",
];

const TAGS = ["OVERLAND", "AVANZADO", "FAMILIAR", "ROCK CRAWLING", "EXPEDICIÓN", "NOCTURNA", "OTRO"];

export default function CrearEventoPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "08:00",
    location: "",
    state: "",
    level: "Verde",
    spots: "20",
    tag: "OVERLAND",
    tag_custom: "",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
        setPhase("form");
      } else {
        setPhase("auth");
      }
    });
  }, []);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError("");

    if (!form.title || !form.date || !form.location || !form.state) {
      setError("Completa los campos obligatorios.");
      return;
    }

    const iso = `${form.date}T${form.time}:00`;
    const spots = parseInt(form.spots) || 20;
    const tag = form.tag === "OTRO" ? form.tag_custom.toUpperCase() : form.tag;

    setSaving(true);
    const { error: dbError } = await supabase.from("user_events").insert({
      user_id: user.id,
      title: form.title,
      description: form.description || null,
      date: iso,
      location: form.location,
      state: form.state,
      level: form.level,
      spots,
      spots_left: spots,
      tag,
    });
    setSaving(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }
    setPhase("submitted");
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-20">
        <div className="shell max-w-2xl">
          {phase === "loading" && (
            <div className="flex h-40 items-center justify-center">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-trail-500 border-t-transparent" />
            </div>
          )}

          {phase === "auth" && (
            <div className="flex flex-col items-center gap-6 py-20 text-center">
              <span className="text-4xl">🔒</span>
              <h1 className="font-display text-3xl text-bone">Inicia sesión para crear un evento</h1>
              <p className="max-w-sm text-mute">
                Solo los miembros de Línea Brava pueden publicar eventos en la comunidad.
              </p>
              <button
                onClick={() =>
                  supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: { redirectTo: `${location.origin}/auth/callback?next=/eventos/crear` },
                  })
                }
                className="flex items-center gap-3 rounded-full border border-ink-600 bg-ink-800 px-6 py-3 text-sm font-semibold text-bone transition-colors hover:border-ink-400"
              >
                <GoogleIcon /> Continuar con Google
              </button>
            </div>
          )}

          {phase === "form" && (
            <>
              <div className="mb-10">
                <span className="eyebrow mb-4 flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-trail-500" />
                  Comunidad
                </span>
                <h1 className="h2 text-bone">Crear evento</h1>
                <p className="mt-3 text-mute">
                  Tu evento será revisado y publicado en el calendario de la comunidad.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-7">
                {/* Title */}
                <Field label="Nombre del evento *">
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="Ej. Expedición Barrancas del Cobre"
                    className="input-field"
                    required
                  />
                </Field>

                {/* Description */}
                <Field label="Descripción">
                  <textarea
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    rows={3}
                    placeholder="Cuéntale a la comunidad de qué va la salida..."
                    className="input-field resize-none"
                  />
                </Field>

                {/* Date + Time */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Fecha *">
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => set("date", e.target.value)}
                      className="input-field"
                      required
                    />
                  </Field>
                  <Field label="Hora de salida">
                    <input
                      type="time"
                      value={form.time}
                      onChange={(e) => set("time", e.target.value)}
                      className="input-field"
                    />
                  </Field>
                </div>

                {/* Location */}
                <Field label="Punto de reunión *">
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => set("location", e.target.value)}
                    placeholder="Ej. Estacionamiento Pemex, km 45 carretera a Creel"
                    className="input-field"
                    required
                  />
                </Field>

                {/* State */}
                <Field label="Estado *">
                  <select
                    value={form.state}
                    onChange={(e) => set("state", e.target.value)}
                    className="input-field"
                    required
                  >
                    <option value="">Selecciona un estado</option>
                    {MEXICAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>

                {/* Level + Spots */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nivel de dificultad">
                    <select
                      value={form.level}
                      onChange={(e) => set("level", e.target.value)}
                      className="input-field"
                    >
                      <option value="Verde">Verde · Fácil</option>
                      <option value="Azul">Azul · Moderado</option>
                      <option value="Negro">Negro · Difícil</option>
                      <option value="Pro">Pro · Experto</option>
                    </select>
                  </Field>
                  <Field label="Lugares disponibles">
                    <input
                      type="number"
                      min="2"
                      max="200"
                      value={form.spots}
                      onChange={(e) => set("spots", e.target.value)}
                      className="input-field"
                    />
                  </Field>
                </div>

                {/* Tag */}
                <Field label="Tipo de salida">
                  <select
                    value={form.tag}
                    onChange={(e) => set("tag", e.target.value)}
                    className="input-field"
                  >
                    {TAGS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {form.tag === "OTRO" && (
                    <input
                      type="text"
                      value={form.tag_custom}
                      onChange={(e) => set("tag_custom", e.target.value)}
                      placeholder="Nombre del tipo de salida"
                      className="input-field mt-2"
                    />
                  )}
                </Field>

                {error && (
                  <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary disabled:opacity-50"
                  >
                    {saving ? "Enviando…" : "Publicar evento"}
                  </button>
                  <Link href="/eventos" className="btn-ghost">
                    Cancelar
                  </Link>
                </div>
              </form>
            </>
          )}

          {phase === "submitted" && (
            <div className="flex flex-col items-center gap-6 py-20 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-go-500/15 text-4xl">
                ✓
              </span>
              <h1 className="font-display text-3xl text-bone">Evento enviado</h1>
              <p className="max-w-sm text-mute">
                Tu evento está en revisión. Lo publicaremos en el calendario de la comunidad
                en cuanto lo aprobemos.
              </p>
              <div className="flex gap-3">
                <Link href="/eventos" className="btn-primary">
                  Ver eventos
                </Link>
                <Link href="/perfil" className="btn-ghost">
                  Mi perfil
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-bone">{label}</span>
      {children}
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}
