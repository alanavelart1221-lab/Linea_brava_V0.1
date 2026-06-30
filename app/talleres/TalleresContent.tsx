"use client";

import { useState, useEffect, useCallback } from "react";
import { TallerCard } from "@/components/TallerCard";
import type { TallerCardData } from "@/components/TallerCard";
import type { Provider } from "@/lib/providers";
import { Reveal, RevealGroup } from "@/components/Reveal";

type Filtro = "todos" | "verificados" | "mejor-valorados" | "cercanos" | "abiertos";

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isAbiertoAhora(horario: string | null | undefined): boolean {
  if (!horario) return false;
  const match = horario.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
  if (!match) return false;
  const abre = parseInt(match[1]) * 60 + parseInt(match[2]);
  const cierra = parseInt(match[3]) * 60 + parseInt(match[4]);
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= abre && mins < cierra;
}

const FILTROS: { id: Filtro; label: string }[] = [
  { id: "todos",          label: "Todos" },
  { id: "cercanos",       label: "Cercanos" },
  { id: "mejor-valorados", label: "Mejor Valorados" },
  { id: "verificados",    label: "Verificados" },
  { id: "abiertos",       label: "Abiertos Ahora" },
];

export function TalleresContent({ talleres }: { talleres: Provider[] }) {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geoDenied, setGeoDenied] = useState(false);

  const pedirGeo = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoDenied(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeoDenied(true),
      { timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    if (filtro === "cercanos" && !userPos && !geoDenied) {
      pedirGeo();
    }
  }, [filtro, userPos, geoDenied, pedirGeo]);

  const withDistance: TallerCardData[] = talleres.map((t) => {
    if (userPos && t.lat != null && t.lng != null) {
      return { ...t, distancia: haversineKm(userPos.lat, userPos.lng, t.lat, t.lng) };
    }
    return t;
  });

  let lista = [...withDistance];

  if (filtro === "verificados") {
    lista = lista.filter((t) => t.verificado);
  } else if (filtro === "abiertos") {
    lista = lista.filter((t) => isAbiertoAhora(t.horario));
  } else if (filtro === "cercanos" && userPos) {
    lista = lista
      .filter((t) => t.distancia != null)
      .sort((a, b) => (a.distancia ?? Infinity) - (b.distancia ?? Infinity));
    if (lista.length === 0) {
      lista = withDistance;
    }
  }

  const empty = lista.length === 0;

  return (
    <div>
      {/* Chips de filtro */}
      <div className="mb-8 flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
              filtro === f.id
                ? "border-trail-500 bg-trail-500 text-ink-950"
                : "border-ink-600 bg-transparent text-mute hover:border-trail-500/50 hover:text-bone"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Aviso geolocalización */}
      {filtro === "cercanos" && geoDenied && (
        <p className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          No fue posible obtener tu ubicación. Activa los permisos de localización e intenta de nuevo.
        </p>
      )}
      {filtro === "cercanos" && !userPos && !geoDenied && (
        <p className="mb-6 text-sm text-mute">Obteniendo tu ubicación…</p>
      )}

      {/* Grid */}
      {empty ? (
        <div className="rounded-2xl border border-dashed border-ink-600 bg-ink-900/40 p-16 text-center">
          <p className="text-mute">
            {filtro === "verificados"
              ? "No hay talleres verificados todavía."
              : filtro === "abiertos"
              ? "No hay talleres abiertos en este momento según su horario registrado."
              : filtro === "cercanos"
              ? "No hay talleres con ubicación registrada cerca de ti."
              : "Aún no hay talleres registrados."}
          </p>
        </div>
      ) : (
        <RevealGroup>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {lista.map((t) => (
              <Reveal key={t.id}>
                <TallerCard taller={t} />
              </Reveal>
            ))}
          </div>
        </RevealGroup>
      )}
    </div>
  );
}
