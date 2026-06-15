"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const GrabMap = dynamic(() => import("@/components/GrabMapClient"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-ink-900 text-mute text-sm">
      Cargando mapa…
    </div>
  ),
});

type Phase = "idle" | "recording" | "review" | "auth";

const MEXICAN_STATES = [
  "Aguascalientes","Baja California","Baja California Sur","Campeche","Chiapas",
  "Chihuahua","Ciudad de México","Coahuila","Colima","Durango","Guanajuato",
  "Guerrero","Hidalgo","Jalisco","México","Michoacán","Morelos","Nayarit",
  "Nuevo León","Oaxaca","Puebla","Querétaro","Quintana Roo","San Luis Potosí",
  "Sinaloa","Sonora","Tabasco","Tamaulipas","Tlaxcala","Veracruz","Yucatán","Zacatecas",
];

function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) *
      Math.cos((b[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export default function GrabarRutaPage() {
  const router = useRouter();
  const supabase = createClient();

  const [phase, setPhase] = useState<Phase>("idle");
  const [track, setTrack] = useState<[number, number][]>([]);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [state, setState] = useState("");
  const [region, setRegion] = useState("");
  const [level, setLevel] = useState<"Verde" | "Azul" | "Negro" | "Pro">("Verde");

  const watchId = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef<number>(0);

  const totalDistance = track.reduce((acc, pt, i) => {
    if (i === 0) return 0;
    return acc + haversineKm(track[i - 1], pt);
  }, 0);

  function startRecording() {
    if (!navigator.geolocation) {
      setGpsError("Tu dispositivo no soporta GPS.");
      return;
    }
    setTrack([]);
    setPhase("recording");
    startedAt.current = Date.now();

    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const p: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(p);
        setGpsError(null);
        setTrack((prev) => {
          // Only add point if >10m from last to avoid noise
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            if (haversineKm(last, p) < 0.01) return prev;
          }
          return [...prev, p];
        });
      },
      (err) => setGpsError(err.message),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );
  }

  function stopRecording() {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPhase("review");
  }

  useEffect(() => {
    // Check auth first — redirect to login screen if not signed in
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        setPhase("auth");
        return;
      }
      // Get initial GPS position for idle map
      navigator.geolocation?.getCurrentPosition(
        (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      );
    });
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !state || track.length < 2) return;

    setSubmitting(true);
    setSubmitError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSubmitError("Debes iniciar sesión para publicar una ruta.");
      setSubmitting(false);
      return;
    }

    const startCoords = track[0];
    const { error } = await supabase.from("user_routes").insert({
      user_id: user.id,
      name: name.trim(),
      description: description.trim() || null,
      state,
      region: region.trim() || null,
      level,
      distance_km: parseFloat(totalDistance.toFixed(2)),
      track,
      start_coords: { lat: startCoords[0], lng: startCoords[1] },
      status: "pending",
    });

    if (error) {
      setSubmitError(error.message);
      setSubmitting(false);
      return;
    }

    router.push("/perfil?nueva=1");
  }

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
      : `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (phase === "auth") {
    return (
      <div className="flex h-svh flex-col items-center justify-center gap-6 bg-ink-950 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-trail-500/15 text-trail-500">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
          </svg>
        </div>
        <div>
          <h1 className="font-display text-3xl text-bone">Inicia sesión para grabar</h1>
          <p className="mt-2 max-w-xs text-sm text-mute">
            Necesitas una cuenta para guardar y compartir tus rutas con la comunidad.
          </p>
        </div>
        <button
          onClick={() =>
            supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: `${window.location.origin}/mis-rutas/grabar` },
            })
          }
          className="btn-primary"
        >
          Entrar con Google
        </button>
        <Link href="/" className="text-sm text-mute hover:text-bone">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-svh flex-col bg-ink-950">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-ink-700 bg-ink-900 px-4 py-3">
        <Link href="/perfil" className="flex items-center gap-2 text-sm font-medium text-mute hover:text-bone">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5m0 0l6 6m-6-6l6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Cancelar
        </Link>
        <p className="text-sm font-semibold text-bone">
          {phase === "idle" ? "Grabar ruta" : phase === "recording" ? "Grabando…" : "Datos de la ruta"}
        </p>
        <div className="w-16" />
      </div>

      {phase !== "review" && (
        <>
          <div className="relative flex-1 overflow-hidden">
            <GrabMap track={track} userPosition={userPos} />
            {gpsError && (
              <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-xl border border-red-500/30 bg-ink-900/90 px-4 py-2 text-sm text-red-400 backdrop-blur-sm">
                {gpsError}
              </div>
            )}
          </div>

          <div className="border-t border-ink-700 bg-ink-900 px-4 py-4">
            {phase === "idle" ? (
              <div className="space-y-2 text-center">
                <p className="text-sm text-mute">
                  Sal al terreno, presiona iniciar y el GPS grabará tu ruta automáticamente.
                </p>
                <button onClick={startRecording} className="btn-primary w-full">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                  </span>
                  Iniciar grabación
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                  </span>
                  <div>
                    <p className="text-xs text-mute">Tiempo</p>
                    <p className="font-display text-xl text-bone">{formatTime(elapsed)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-mute">Distancia</p>
                    <p className="font-display text-xl text-bone">{totalDistance.toFixed(2)} km</p>
                  </div>
                  <div>
                    <p className="text-xs text-mute">Puntos</p>
                    <p className="font-display text-xl text-bone">{track.length}</p>
                  </div>
                </div>
                <button
                  onClick={stopRecording}
                  className="rounded-full border border-ink-600 bg-ink-800 px-5 py-2.5 text-sm font-semibold text-bone transition-colors hover:bg-ink-700"
                >
                  Terminar
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {phase === "review" && (
        <div className="flex-1 overflow-y-auto">
          <div className="shell py-8">
            {/* Stats recap */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Distancia", value: `${totalDistance.toFixed(2)} km` },
                { label: "Duración", value: formatTime(elapsed) },
                { label: "Puntos GPS", value: String(track.length) },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-ink-700 bg-ink-900 p-4 text-center">
                  <p className="text-[0.6rem] font-semibold uppercase tracking-widest text-mute">{s.label}</p>
                  <p className="mt-1 font-display text-2xl text-bone">{s.value}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-bone">
                  Nombre de la ruta <span className="text-trail-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Brecha del Cerro Prieto"
                  required
                  className="w-full rounded-xl border border-ink-600 bg-ink-950 px-4 py-3 text-bone placeholder:text-mute/60 focus:border-trail-500 focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-bone">
                    Estado <span className="text-trail-500">*</span>
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                    className="w-full rounded-xl border border-ink-600 bg-ink-950 px-4 py-3 text-bone focus:border-trail-500 focus:outline-none"
                  >
                    <option value="">Selecciona…</option>
                    {MEXICAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-bone">Región / Sierra</label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="Ej. Sierra San Pedro Mártir"
                    className="w-full rounded-xl border border-ink-600 bg-ink-950 px-4 py-3 text-bone placeholder:text-mute/60 focus:border-trail-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-bone">Nivel de dificultad</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["Verde", "Azul", "Negro", "Pro"] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLevel(l)}
                      className={`rounded-xl border py-2 text-sm font-semibold transition-colors ${
                        level === l
                          ? "border-trail-500 bg-trail-500/15 text-trail-400"
                          : "border-ink-600 text-mute hover:border-ink-500"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-bone">Descripción</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe la ruta: acceso, terreno, puntos de interés, recomendaciones…"
                  rows={4}
                  className="w-full rounded-xl border border-ink-600 bg-ink-950 px-4 py-3 text-bone placeholder:text-mute/60 focus:border-trail-500 focus:outline-none"
                />
              </div>

              {submitError && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                  {submitError}
                </p>
              )}

              <div className="rounded-xl border border-ink-700 bg-ink-900 p-4 text-sm text-mute">
                Tu ruta quedará en revisión hasta que un administrador la apruebe. Te avisaremos cuando esté publicada.
              </div>

              <button
                type="submit"
                disabled={submitting || !name.trim() || !state}
                className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Enviando…" : "Enviar para revisión"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
