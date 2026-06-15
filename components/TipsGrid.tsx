"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";

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

function getEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

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
            <TipCard key={tip.id} tip={tip} />
          ))}
        </div>
      )}
    </div>
  );
}

function TipCard({ tip }: { tip: Tip }) {
  const [expanded, setExpanded] = useState(false);
  const embedUrl = tip.video_url ? getEmbedUrl(tip.video_url) : null;
  const short = tip.body.length > 180;

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
      </div>
    </article>
  );
}
