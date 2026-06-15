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

export const providers: Provider[] = [
  {
    id: "tallerx4-monterrey",
    name: "TallerX4 Monterrey",
    type: "taller",
    state: "Nuevo León",
    city: "Monterrey",
    description: "Especialistas en suspensión, transmisiones y preparación de vehículos 4×4. Más de 15 años sirviendo a la comunidad off-road del norte.",
    specialty: ["Suspensión", "Transmisión", "Lift kits", "Blindaje de chasís"],
    phone: "+52 81 1234 5678",
    website: "https://tallerx4.mx",
    featured: true,
  },
  {
    id: "baja-offroad-parts",
    name: "Baja Off-Road Parts",
    type: "distribuidor",
    state: "Baja California",
    city: "Ensenada",
    description: "Distribuidor oficial de ARB, Old Man Emu y Kings Shocks en el noroeste. Refacciones y accesorios para Jeep, Toyota y Ford.",
    specialty: ["ARB", "Kings Shocks", "OME", "Winches", "Luces LED"],
    phone: "+52 646 987 6543",
    featured: true,
  },
  {
    id: "sierra-adventure-guides",
    name: "Sierra Adventure Guides",
    type: "guia",
    state: "Chihuahua",
    city: "Creel",
    description: "Guías certificados con más de 200 rutas exploradas en la Sierra Tarahumara. Expediciones privadas y grupales con soporte completo.",
    specialty: ["Barrancas del Cobre", "Expediciones privadas", "Rescate en campo"],
    phone: "+52 635 456 7890",
    website: "https://sierraadventure.mx",
    featured: true,
  },
  {
    id: "overland-mexico",
    name: "Overland México",
    type: "equipo",
    state: "Ciudad de México",
    city: "CDMX",
    description: "Tienda especializada en equipamiento overland: carpas de techo, estufas, filtros de agua, sistemas eléctricos y todo lo necesario para expediciones de largo aliento.",
    specialty: ["Carpas de techo", "Cocinas de campo", "Energía solar", "Navegación"],
    phone: "+52 55 5678 9012",
    website: "https://overlandmexico.com",
    featured: false,
  },
  {
    id: "desert-storm-eventos",
    name: "Desert Storm 4×4",
    type: "eventos",
    state: "Sonora",
    city: "Hermosillo",
    description: "Organización de eventos off-road en el desierto de Sonora. Desde salidas familiares hasta competencias de rock crawling.",
    specialty: ["Rock crawling", "Competencias", "Salidas familiares", "Baja California"],
    phone: "+52 662 345 6789",
    featured: false,
  },
  {
    id: "ruedas-y-barro",
    name: "Ruedas y Barro",
    type: "taller",
    state: "Jalisco",
    city: "Guadalajara",
    description: "Taller de preparación y mantenimiento off-road en Guadalajara. Especializados en Land Cruiser, Patrol y Defender.",
    specialty: ["Land Cruiser", "Nissan Patrol", "Defender", "Portaequipajes"],
    phone: "+52 33 8901 2345",
    featured: false,
  },
  {
    id: "trail-gear-mx",
    name: "Trail Gear MX",
    type: "distribuidor",
    state: "Querétaro",
    city: "Querétaro",
    description: "Importadora y distribuidora de llantas off-road, rines y accesorios de recuperación para el centro del país.",
    specialty: ["Llantas BFGoodrich", "Rines Method", "Kits de recuperación", "Hi-Lift"],
    phone: "+52 442 234 5678",
    website: "https://trailgearmx.com",
    featured: false,
  },
  {
    id: "expediciones-del-norte",
    name: "Expediciones del Norte",
    type: "guia",
    state: "Coahuila",
    city: "Saltillo",
    description: "Expediciones guiadas por el desierto de Coahuila, Cuatro Ciénegas y las sierras del noreste. Grupos reducidos, experiencia garantizada.",
    specialty: ["Cuatro Ciénegas", "Desierto de Coahuila", "Fotografía de naturaleza"],
    phone: "+52 844 567 8901",
    featured: false,
  },
];

export const PROVIDER_STATES = [...new Set(providers.map((p) => p.state))].sort();
