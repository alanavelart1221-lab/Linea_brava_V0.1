"use client";

import { useMemo, useState } from "react";
import { LEVELS, type TrailLevel } from "@/lib/data";
import type { RouteListItem } from "@/lib/routes";
import { RouteCard } from "./RouteCard";
import { CommunityRouteCard } from "./CommunityRouteCard";
import { Reveal } from "./Reveal";

export function RoutesExplorer({ items = [] }: { items?: RouteListItem[] }) {
  const states = useMemo(
    () => ["Todos", ...Array.from(new Set(items.map((i) => i.state))).sort()],
    [items]
  );

  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<TrailLevel | "Todas">("Todas");
  const [state, setState] = useState("Todos");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((t) => {
      const matchesQuery =
        !q ||
        [t.name, t.region ?? "", t.state, t.blurb ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchesLevel = level === "Todas" || t.level === level;
      const matchesState = state === "Todos" || t.state === state;
      return matchesQuery && matchesLevel && matchesState;
    });
  }, [items, query, level, state]);

  return (
    <div>
      {/* Controls */}
      <div className="sticky top-20 z-30 -mx-[var(--content-pad)] mb-10 border-y border-ink-700 bg-ink-950/85 px-[var(--content-pad)] py-5 backdrop-blur-xl">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca por nombre, estado o terreno…"
              aria-label="Buscar rutas"
              className="w-full rounded-full border border-ink-600 bg-ink-900 py-3.5 pl-12 pr-4 text-bone placeholder:text-mute/70 transition-colors focus:border-trail-400 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Level filter */}
            <div className="flex flex-wrap items-center gap-2">
              <Chip active={level === "Todas"} onClick={() => setLevel("Todas")}>
                Todas
              </Chip>
              {LEVELS.map((l) => (
                <Chip key={l} active={level === l} onClick={() => setLevel(l)}>
                  {l}
                </Chip>
              ))}
            </div>

            {/* State filter */}
            <label className="flex items-center gap-2 text-sm text-mute">
              <span className="hidden sm:inline">Estado:</span>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                aria-label="Filtrar por estado"
                className="rounded-full border border-ink-600 bg-ink-900 px-4 py-2 text-bone transition-colors focus:border-trail-400 focus:outline-none cursor-pointer"
              >
                {states.map((s) => (
                  <option key={s} value={s} className="bg-ink-900">
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* Result count */}
      <p className="mb-6 text-sm text-mute">
        {results.length === 0
          ? "Sin resultados"
          : `${results.length} ${results.length === 1 ? "ruta" : "rutas"}`}
      </p>

      {/* Grid */}
      {results.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((item, i) => (
            <Reveal key={item.key} delay={Math.min(i * 0.05, 0.3)}>
              {item.kind === "oficial" ? (
                <RouteCard route={item} priority={i < 3} />
              ) : (
                <CommunityRouteCard route={item} />
              )}
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="rounded-xl2 border border-dashed border-ink-600 p-12 text-center">
          <p className="font-display text-2xl text-bone">Nada por aquí… todavía.</p>
          <p className="mt-2 text-mute">
            Prueba con otro término o quita algún filtro.
          </p>
          <button
            onClick={() => {
              setQuery("");
              setLevel("Todas");
              setState("Todos");
            }}
            className="btn-ghost mt-6"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 cursor-pointer ${
        active
          ? "border-trail-400 bg-trail-500/15 text-trail-300"
          : "border-ink-600 text-mute hover:border-ink-500 hover:text-bone"
      }`}
    >
      {children}
    </button>
  );
}
