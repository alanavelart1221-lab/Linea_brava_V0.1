export type ProviderType = "taller" | "distribuidor" | "guia" | "eventos" | "equipo";

export interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  state: string;
  city: string;
  description: string;
  specialty: string[];
  phone: string;
  website?: string;
  featured: boolean;
}

export const TYPE_META: Record<ProviderType, { label: string; className: string }> = {
  taller:      { label: "Taller 4×4",             className: "border-blue-500/40 bg-blue-500/10 text-blue-400" },
  distribuidor:{ label: "Distribuidora",           className: "border-purple-500/40 bg-purple-500/10 text-purple-400" },
  guia:        { label: "Guía de Ruta",            className: "border-go-500/40 bg-go-500/10 text-go-400" },
  eventos:     { label: "Organizador de Eventos",  className: "border-trail-500/40 bg-trail-500/10 text-trail-400" },
  equipo:      { label: "Equipo Overland",         className: "border-orange-500/40 bg-orange-500/10 text-orange-400" },
};

// Los proveedores reales viven en Supabase (tabla `providers`) y se cargan en
// `app/proveedores/page.tsx`. Este arreglo queda vacío a propósito: no hay
// proveedores de ejemplo. La página de detalle de ruta lo usa como respaldo y
// ya muestra un estado vacío cuando no hay coincidencias.
export const providers: Provider[] = [];
