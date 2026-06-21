"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { reviewStats, type RouteReview } from "@/lib/reviews";

type Target = { trailSlug: string } | { userRouteId: string };

export function RouteReviews(props: Target) {
  const supabase = createClient();
  const isTrail = "trailSlug" in props;
  const column = isTrail ? "trail_slug" : "user_route_id";
  const value = isTrail ? props.trailSlug : props.userRouteId;

  const [reviews, setReviews] = useState<RouteReview[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estado del formulario propio.
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("route_reviews")
      .select("*")
      .eq(column, value)
      .order("created_at", { ascending: false });
    setReviews((data as RouteReview[] | null) ?? []);
  }, [supabase, column, value]);

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("rol")
          .eq("id", user.id)
          .single();
        if (!active) return;
        const rol = profile?.rol as string | undefined;
        setIsAdmin(rol === "admin" || rol === "superadmin");
      }

      await load();
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Prefill con la reseña propia (si existe) cuando llegan los datos.
  const myReview = user ? reviews.find((r) => r.user_id === user.id) ?? null : null;
  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setBody(myReview.body ?? "");
    }
  }, [myReview?.id]);

  const { average, count } = reviewStats(reviews);

  async function submit() {
    if (!user) return;
    if (rating < 1) {
      setError("Elige una calificación de 1 a 5 estrellas.");
      return;
    }
    setSaving(true);
    setError(null);

    const authorName =
      (user.user_metadata?.full_name as string | undefined) ??
      user.email?.split("@")[0] ??
      "Miembro";

    let dbError = null;
    if (myReview) {
      const { error } = await supabase
        .from("route_reviews")
        .update({ rating, body: body.trim() || null, updated_at: new Date().toISOString() })
        .eq("id", myReview.id);
      dbError = error;
    } else {
      const { error } = await supabase.from("route_reviews").insert({
        user_id: user.id,
        trail_slug: isTrail ? value : null,
        user_route_id: isTrail ? null : value,
        rating,
        body: body.trim() || null,
        author_name: authorName,
      });
      dbError = error;
    }

    setSaving(false);
    if (dbError) {
      setError("No se pudo guardar tu reseña. Intenta de nuevo.");
      return;
    }
    await load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar esta reseña?")) return;
    await supabase.from("route_reviews").delete().eq("id", id);
    if (myReview?.id === id) {
      setRating(0);
      setBody("");
    }
    await load();
  }

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-4xl text-bone">Reseñas</h2>
        {count > 0 && (
          <div className="flex items-center gap-2">
            <Stars value={Math.round(average)} />
            <span className="font-display text-2xl text-bone">{average.toFixed(1)}</span>
            <span className="text-sm text-mute">
              ({count} {count === 1 ? "reseña" : "reseñas"})
            </span>
          </div>
        )}
      </div>

      {/* Formulario */}
      {loading ? (
        <div className="mt-6 h-24 animate-pulse rounded-2xl bg-ink-800" />
      ) : user ? (
        <div className="card-line mt-6 p-6">
          <p className="text-sm font-semibold text-bone">
            {myReview ? "Tu reseña" : "Califica esta ruta"}
          </p>
          <div className="mt-3">
            <StarPicker
              value={hover || rating}
              onHover={setHover}
              onSelect={setRating}
            />
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Cuenta cómo te fue en esta ruta (opcional)…"
            className="input-field mt-4 resize-none"
          />
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={submit}
              disabled={saving}
              className="btn-primary disabled:opacity-50"
            >
              {saving ? "Guardando…" : myReview ? "Actualizar reseña" : "Publicar reseña"}
            </button>
            {myReview && (
              <button
                onClick={() => remove(myReview.id)}
                className="text-sm font-semibold text-red-400/80 transition-colors hover:text-red-400"
              >
                Borrar la mía
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed border-ink-600 bg-ink-900/40 p-6 text-sm text-mute">
          Inicia sesión para calificar y reseñar esta ruta.
        </p>
      )}

      {/* Lista */}
      {!loading && count > 0 && (
        <ul className="mt-6 space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="card-line p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-trail-400">{r.author_name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Stars value={r.rating} size={14} />
                    <span className="text-xs text-mute">
                      {new Date(r.created_at).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                {(isAdmin || (user && r.user_id === user.id)) && (
                  <button
                    onClick={() => remove(r.id)}
                    className="shrink-0 text-xs font-semibold text-red-400/80 transition-colors hover:text-red-400"
                  >
                    Borrar
                  </button>
                )}
              </div>
              {r.body && (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-mute">
                  {r.body}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {!loading && count === 0 && (
        <p className="mt-6 text-sm text-mute">
          Aún no hay reseñas. {user ? "Sé el primero en calificar." : ""}
        </p>
      )}
    </section>
  );
}

/** Estrellas de solo lectura. */
function Stars({ value, size = 18 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon key={i} filled={i <= value} size={size} />
      ))}
    </div>
  );
}

/** Selector interactivo de estrellas. */
function StarPicker({
  value,
  onHover,
  onSelect,
}: {
  value: number;
  onHover: (v: number) => void;
  onSelect: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => onHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => onHover(i)}
          onClick={() => onSelect(i)}
          className="transition-transform hover:scale-110"
          aria-label={`${i} estrella${i > 1 ? "s" : ""}`}
        >
          <StarIcon filled={i <= value} size={28} />
        </button>
      ))}
    </div>
  );
}

function StarIcon({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      className={filled ? "text-trail-500" : "text-ink-600"}
      aria-hidden="true"
    >
      <path
        d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.77l-5.8 3.05 1.1-6.46-4.69-4.58 6.49-.94L12 2.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
