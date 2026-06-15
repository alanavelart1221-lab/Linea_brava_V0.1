"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProviderCard } from "@/components/ProviderCard";
import { providers, TYPE_META, PROVIDER_STATES } from "@/lib/providers";
import type { ProviderType } from "@/lib/providers";
import Link from "next/link";

const ALL = "todos";
type Filter = ProviderType | typeof ALL;

export default function ProveedoresPage() {
  return (
    <Suspense>
      <ProveedoresContent />
    </Suspense>
  );
}

function ProveedoresContent() {
  const searchParams = useSearchParams();
  const [typeFilter, setTypeFilter] = useState<Filter>(ALL);
  const [stateFilter, setStateFilter] = useState<string>(ALL);

  useEffect(() => {
    const estado = searchParams.get("estado");
    if (estado && PROVIDER_STATES.includes(estado)) {
      setStateFilter(estado);
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    return providers.filter((p) => {
      const matchType = typeFilter === ALL || p.type === typeFilter;
      const matchState = stateFilter === ALL || p.state === stateFilter;
      return matchType && matchState;
    }).sort((a, b) => Number(b.featured) - Number(a.featured));
  }, [typeFilter, stateFilter]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-20">
        <div className="shell">
          {/* Header */}
          <div className="mb-12">
            <span className="eyebrow mb-4 flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-trail-500" />
              Directorio de especialistas
            </span>
            <h1 className="h2 text-trail-500">Proveedores off-road</h1>
            <p className="mt-4 max-w-xl text-mute">
              Talleres, distribuidoras, guías y organizadores verificados por la comunidad
              Línea Brava. Encuentra al especialista que necesitas para tu próxima aventura.
            </p>
          </div>

          {/* CTA banner */}
          <div className="mb-10 flex flex-col gap-4 rounded-2xl border border-trail-500/30 bg-trail-500/5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-lg text-bone">¿Tienes un negocio off-road?</p>
              <p className="mt-1 text-sm text-mute">
                Aparece aquí, recibe prospectos directos y conéctate con miles de entusiastas.
              </p>
            </div>
            <Link
              href="#planes"
              className="shrink-0 rounded-full bg-trail-500 px-6 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-trail-400"
            >
              Ver planes
            </Link>
          </div>

          {/* Filters */}
          <div className="mb-8 flex flex-wrap gap-3">
            <button
              onClick={() => setTypeFilter(ALL)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                typeFilter === ALL
                  ? "border-trail-500 bg-trail-500 text-ink-950"
                  : "border-ink-600 text-mute hover:border-ink-400 hover:text-bone"
              }`}
            >
              Todos
            </button>
            {(Object.keys(TYPE_META) as ProviderType[]).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                  typeFilter === t
                    ? "border-trail-500 bg-trail-500 text-ink-950"
                    : "border-ink-600 text-mute hover:border-ink-400 hover:text-bone"
                }`}
              >
                {TYPE_META[t].label}
              </button>
            ))}

            <div className="w-full sm:ml-auto sm:w-auto">
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="w-full rounded-full border border-ink-600 bg-ink-900 px-4 py-1.5 text-sm text-mute focus:border-trail-500 focus:outline-none sm:w-auto"
              >
                <option value={ALL}>Todos los estados</option>
                {PROVIDER_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results count */}
          <p className="mb-6 text-xs text-mute">
            {filtered.length} proveedor{filtered.length !== 1 ? "es" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
          </p>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p) => (
                <ProviderCard key={p.id} provider={p} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <p className="text-lg text-bone">Sin resultados</p>
              <p className="text-sm text-mute">Prueba otro filtro o estado.</p>
              <button
                onClick={() => { setTypeFilter(ALL); setStateFilter(ALL); }}
                className="mt-2 text-sm font-semibold text-trail-400 hover:text-trail-300"
              >
                Limpiar filtros
              </button>
            </div>
          )}

          {/* Plans section */}
          <section id="planes" className="mt-24">
            <div className="mb-12 text-center">
              <span className="eyebrow mb-4 flex items-center justify-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-trail-500" />
                Para negocios
              </span>
              <h2 className="h2 text-bone">Planes de visibilidad</h2>
              <p className="mx-auto mt-4 max-w-xl text-mute">
                Conecta tu negocio con la comunidad off-road más activa de México.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <PlanCard
                name="Básico"
                price="$599"
                period="mes"
                features={[
                  "Perfil en el directorio",
                  "Foto y descripción",
                  "Botón de contacto directo",
                  "Hasta 3 especialidades",
                ]}
              />
              <PlanCard
                name="Pro"
                price="$1,499"
                period="mes"
                featured
                features={[
                  "Todo lo del plan Básico",
                  "Posicionamiento prioritario",
                  "Etiqueta «Destacado»",
                  "Recepción de prospectos",
                  "Solicitudes de cotización",
                  "Publicaciones en el feed",
                ]}
              />
              <PlanCard
                name="Elite"
                price="$2,999"
                period="mes"
                features={[
                  "Todo lo del plan Pro",
                  "Banner en rutas relevantes",
                  "Publicaciones patrocinadas",
                  "Estadísticas de prospectos",
                  "Soporte prioritario",
                ]}
              />
            </div>

            <p className="mt-8 text-center text-sm text-mute">
              ¿Dudas o plan personalizado?{" "}
              <a
                href="mailto:proveedores@lineabrava.mx"
                className="font-semibold text-trail-400 hover:text-trail-300"
              >
                Escríbenos
              </a>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

function PlanCard({
  name,
  price,
  period,
  features,
  featured = false,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  featured?: boolean;
}) {
  return (
    <div
      className={`flex flex-col rounded-2xl border p-8 ${
        featured
          ? "border-trail-500/60 bg-trail-500/5"
          : "border-ink-700 bg-ink-900"
      }`}
    >
      {featured && (
        <span className="mb-4 self-start rounded-full border border-trail-500/40 bg-trail-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-trail-400">
          Más popular
        </span>
      )}
      <h3 className="font-display text-2xl text-bone">{name}</h3>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-display text-4xl text-trail-500">{price}</span>
        <span className="text-sm text-mute">/ {period}</span>
      </div>

      <ul className="my-8 flex flex-col gap-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-sm text-mute">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-trail-500"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {f}
          </li>
        ))}
      </ul>

      <a
        href="mailto:proveedores@lineabrava.mx"
        className={`mt-auto block rounded-full py-3 text-center text-sm font-semibold transition-colors ${
          featured
            ? "bg-trail-500 text-ink-950 hover:bg-trail-400"
            : "border border-ink-600 text-bone hover:border-ink-400"
        }`}
      >
        Solicitar este plan
      </a>
    </div>
  );
}
