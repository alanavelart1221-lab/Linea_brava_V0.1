"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { getEmbedUrl } from "@/lib/videoEmbed";
import { subirTipAComunidad } from "@/app/admin/tips/actions";

export interface Tip {
  id: string;
  title: string;
  category: string;
  body: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
}

const CATEGORIES = ["Todos", "Mecánica", "Equipo", "Navegación", "Seguridad", "General"];

export function TipsGrid({ tips, isAdmin }: { tips: Tip[]; isAdmin: boolean }) {
  const [cat, setCat] = useState("Todos");

  const filtered = useMemo(
    () => (cat === "Todos" ? tips : tips.filter((t) => t.category === cat)),
    [tips, cat]
  );

  return (
    <div>
      {/* Category filter */}
      <div className="mb-8 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
              cat === c
                ? "border-trail-500 bg-trail-500 text-ink-950"
                : "border-ink-600 text-mute hover:border-ink-400 hover:text-bone"
            }`}
          >
            {c}
          </button>
        ))}
        {isAdmin && (
          <Link
            href="/admin/tips/nuevo"
            className="ml-auto rounded-full bg-trail-500 px-4 py-1.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-trail-400"
          >
            + Nuevo tip
          </Link>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <p className="text-lg text-bone">Aún no hay tips{cat !== "Todos" ? ` en ${cat}` : ""}.</p>
          {isAdmin && (
            <Link href="/admin/tips/nuevo" className="btn-primary mt-2">
              Crear el primero
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((tip) => (
            <TipCard key={tip.id} tip={tip} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </div>
  );
}

function TipCard({ tip, isAdmin }: { tip: Tip; isAdmin: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "done" | "error">("idle");
  const [pending, startTransition] = useTransition();
  const embedUrl = tip.video_url ? getEmbedUrl(tip.video_url) : null;
  const short = tip.body.length > 180;

  function handleShare() {
    startTransition(async () => {
      const { error } = await subirTipAComunidad(tip.id);
      setShareState(error ? "error" : "done");
    });
  }

  return (
    <article className="card-line flex flex-col overflow-hidden transition-colors hover:border-ink-600">
      {/* Media */}
      {embedUrl ? (
        <div className="aspect-video w-full overflow-hidden">
          <iframe
            src={embedUrl}
            title={tip.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      ) : tip.image_url ? (
        <div className="relative aspect-video w-full overflow-hidden">
          <Image
            src={tip.image_url}
            alt={tip.title}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-3 p-6">
        <span className="self-start rounded-full border border-trail-500/40 bg-trail-500/10 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-widest text-trail-400">
          {tip.category}
        </span>
        <h3 className="font-display text-xl text-bone">{tip.title}</h3>
        <p className="text-sm leading-relaxed text-mute">
          {expanded || !short ? tip.body : `${tip.body.slice(0, 180)}…`}
        </p>
        {short && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="self-start text-xs font-semibold text-trail-400 hover:text-trail-300"
          >
            {expanded ? "Ver menos" : "Ver más"}
          </button>
        )}
        {isAdmin && (
          <div className="mt-auto border-t border-ink-700 pt-3">
            <button
              onClick={handleShare}
              disabled={pending || shareState === "done"}
              className={`w-full rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                shareState === "done"
                  ? "border-go-500/40 text-go-400"
                  : shareState === "error"
                    ? "border-trail-500/40 text-trail-400"
                    : "border-ink-600 text-mute hover:border-trail-400 hover:text-trail-400"
              } disabled:cursor-default`}
            >
              {pending
                ? "Subiendo…"
                : shareState === "done"
                  ? "Publicado en comunidad ✓"
                  : shareState === "error"
                    ? "Error, intenta de nuevo"
                    : "Subir a comunidad"}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
