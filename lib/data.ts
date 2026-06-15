export type TrailLevel = "Verde" | "Azul" | "Negro" | "Pro";

export interface Trail {
  slug: string;
  name: string;
  region: string;
  state: string;
  distanceKm: number;
  elevationM: number;
  level: TrailLevel;
  duration: string;
  bestSeason: string;
  terrain: string[];
  blurb: string;
  description: string[];
  gear: string[];
  coords: { lat: number; lng: number };
  track: [number, number][];
  image: string;
  gallery: string[];
}

export interface EventItem {
  id: string;
  date: string; // ISO
  title: string;
  location: string;
  level: TrailLevel;
  spots: number;
  spotsLeft: number;
  tag: string;
  routeSlug?: string;
}

export interface Stat {
  value: number;
  suffix: string;
  label: string;
}

export interface Voice {
  quote: string;
  name: string;
  role: string;
  rig: string;
}

// Próxima salida insignia — alimenta el contador (Día de la Independencia).
export const NEXT_RUN_ISO = "2026-09-16T07:00:00";

export const stats: Stat[] = [
  { value: 4200, suffix: "+", label: "Miembros en ruta" },
  { value: 318, suffix: "", label: "Rutas recorridas este año" },
  { value: 27, suffix: "", label: "Estados explorados" },
  { value: 96, suffix: "%", label: "Volverían a la ruta" },
];

const IMG = {
  ridge: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=70",
  mountainRoad: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=70",
  campNight: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=70",
  jeep: "https://images.unsplash.com/photo-1486611367184-17759508999c?auto=format&fit=crop&w=1200&q=70",
  dunes: "https://images.unsplash.com/photo-1421789665209-c9b2a435e3dc?auto=format&fit=crop&w=1200&q=70",
  forest: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=70",
  peaks: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=70",
  desertRoad: "https://images.unsplash.com/photo-1504457047772-27faf1c00561?auto=format&fit=crop&w=1200&q=70",
  alpine: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=70",
  desert: "https://images.unsplash.com/photo-1444927714506-8492d94b5ba0?auto=format&fit=crop&w=1200&q=70",
};

const GEAR_BASE = ["Llantas A/T en buen estado", "Tanque lleno + reserva", "Agua y víveres", "Radio o señal celular"];
const GEAR_AZUL = [...GEAR_BASE, "Tablas de tracción", "Compresor de aire", "Kit de parches"];
const GEAR_NEGRO = [...GEAR_AZUL, "Diferencial trasero bloqueado", "Protecciones bajas (skid plates)", "Winch recomendado", "Spotter"];
const GEAR_PRO = [...GEAR_NEGRO, "Winch obligatorio", "Low range (4L)", "Snorkel", "Convoy mínimo de 3 vehículos"];

export const trails: Trail[] = [
  {
    slug: "canon-del-diablo",
    name: "Cañón del Diablo",
    region: "Sierra San Pedro Mártir",
    state: "Baja California",
    distanceKm: 38,
    elevationM: 2100,
    level: "Negro",
    duration: "Día completo",
    bestSeason: "Oct – Abr",
    terrain: ["Roca", "Cruce de río", "Cañón"],
    blurb:
      "Jardines de roca técnicos y un cruce de río que humilla a las camionetas nuevas. La joya de la corona del calendario.",
    description: [
      "El Cañón del Diablo se abre paso por la falda del Picacho del Diablo, el punto más alto de Baja California. Es una ruta de roca densa, con escalones que exigen líneas precisas y un spotter atento.",
      "El cruce del arroyo a media ruta es el momento decisivo: dependiendo de la temporada, el agua puede llegar a los rines. Recompensa con vistas al granito de la sierra que pocos llegan a ver desde el volante.",
    ],
    gear: GEAR_NEGRO,
    coords: { lat: 30.97, lng: -115.42 },
    track: [
      [30.94, -115.46],
      [30.95, -115.44],
      [30.97, -115.42],
      [30.99, -115.41],
      [31.01, -115.39],
    ],
    image: IMG.ridge,
    gallery: [IMG.jeep, IMG.peaks, IMG.mountainRoad],
  },
  {
    slug: "sierra-gorda",
    name: "Sierra Gorda",
    region: "Jalpan de Serra",
    state: "Querétaro",
    distanceKm: 64,
    elevationM: 1400,
    level: "Azul",
    duration: "6 – 7 hrs",
    bestSeason: "Todo el año",
    terrain: ["Terracería", "Bosque de niebla", "Cresta"],
    blurb:
      "Cresta de terracería entre bosque de niebla, con curvas panorámicas. Rápida, fluida y perdonadora — ideal para debutantes.",
    description: [
      "La reserva de la biósfera Sierra Gorda regala una de las terracerías más escénicas del centro de México. Curvas amplias y firmes que serpentean entre bosque de niebla y miradores naturales.",
      "Es la ruta perfecta para estrenar tu 4x4: terreno exigente pero predecible, con paradas en pueblos serranos y misiones franciscanas patrimonio de la humanidad.",
    ],
    gear: GEAR_AZUL,
    coords: { lat: 21.22, lng: -99.47 },
    track: [
      [21.18, -99.52],
      [21.2, -99.5],
      [21.22, -99.47],
      [21.25, -99.45],
      [21.28, -99.43],
    ],
    image: IMG.forest,
    gallery: [IMG.mountainRoad, IMG.peaks, IMG.alpine],
  },
  {
    slug: "laguna-salada",
    name: "Laguna Salada",
    region: "Mexicali",
    state: "Baja California",
    distanceKm: 112,
    elevationM: 60,
    level: "Verde",
    duration: "Una noche",
    bestSeason: "Nov – Mar",
    terrain: ["Lecho seco", "Planicie", "Arena"],
    blurb:
      "Un clásico overland. Acampa bajo cielo sin contaminación lumínica tras un día manejando sobre el lecho seco y espejeante.",
    description: [
      "La Laguna Salada es un enorme lecho lacustre seco al sur de Mexicali: kilómetros de planicie perfecta para rodar a velocidad de crucero y aprender a leer el terreno blando.",
      "Al caer la noche montamos campamento en medio de la nada. Sin contaminación lumínica, la Vía Láctea se refleja en la sal. Es la introducción ideal al overland en familia.",
    ],
    gear: GEAR_BASE,
    coords: { lat: 32.3, lng: -115.62 },
    track: [
      [32.24, -115.7],
      [32.27, -115.66],
      [32.3, -115.62],
      [32.34, -115.58],
      [32.37, -115.54],
    ],
    image: IMG.campNight,
    gallery: [IMG.desert, IMG.desertRoad, IMG.dunes],
  },
  {
    slug: "barrancas-del-cobre",
    name: "Barrancas del Cobre",
    region: "Creel",
    state: "Chihuahua",
    distanceKm: 47,
    elevationM: 2400,
    level: "Pro",
    duration: "2 días",
    bestSeason: "Mar – Nov",
    terrain: ["Cañón profundo", "Roca suelta", "Vados"],
    blurb:
      "Territorio de rescate con winch. Diferenciales bloqueados, low range y un spotter no se negocian. Solo en convoy.",
    description: [
      "Más profundas que el Gran Cañón, las Barrancas del Cobre son el examen final del calendario. Descensos de roca suelta, pendientes pronunciadas y vados que cambian con la lluvia.",
      "Se corre solo en convoy y con dos días por delante: pernoctamos en la sierra Tarahumara antes del ascenso de regreso. No es una ruta para improvisar — es para la que te has estado preparando.",
    ],
    gear: GEAR_PRO,
    coords: { lat: 27.75, lng: -107.63 },
    track: [
      [27.7, -107.7],
      [27.73, -107.66],
      [27.75, -107.63],
      [27.79, -107.6],
      [27.82, -107.56],
    ],
    image: IMG.peaks,
    gallery: [IMG.jeep, IMG.ridge, IMG.mountainRoad],
  },
  {
    slug: "dunas-de-samalayuca",
    name: "Dunas de Samalayuca",
    region: "Ciudad Juárez",
    state: "Chihuahua",
    distanceKm: 28,
    elevationM: 120,
    level: "Azul",
    duration: "Medio día",
    bestSeason: "Oct – Abr",
    terrain: ["Dunas de arena", "Médanos"],
    blurb:
      "Un mar de arena blanca al sur de Juárez. Aprende a desinflar, a flotar sobre el médano y a no enterrarte.",
    description: [
      "Los Médanos de Samalayuca son dunas de arena fina y blanca que parecen sacadas de otro planeta. El reto es puramente de técnica de arena: presión correcta, impulso constante y lectura de la duna.",
      "Ideal como segundo paso después de una ruta Verde. Practicamos desinflado, recuperación en arena y manejo de médano antes de soltarte en las dunas grandes.",
    ],
    gear: GEAR_AZUL,
    coords: { lat: 31.34, lng: -106.5 },
    track: [
      [31.31, -106.54],
      [31.32, -106.52],
      [31.34, -106.5],
      [31.36, -106.48],
      [31.38, -106.46],
    ],
    image: IMG.dunes,
    gallery: [IMG.desert, IMG.desertRoad, IMG.campNight],
  },
  {
    slug: "real-de-catorce",
    name: "Real de Catorce",
    region: "Sierra de Catorce",
    state: "San Luis Potosí",
    distanceKm: 54,
    elevationM: 1600,
    level: "Azul",
    duration: "Día completo",
    bestSeason: "Todo el año",
    terrain: ["Terracería", "Desierto alto", "Pueblo minero"],
    blurb:
      "Terracería del altiplano hacia un pueblo fantasma a 2,700 m. Historia minera, desierto y cielos enormes.",
    description: [
      "La subida a Real de Catorce mezcla planicie desértica con terracería de montaña hasta este pueblo minero semifantasma encaramado en la sierra del altiplano potosino.",
      "Una ruta tan cultural como técnica: socavones, capillas y el famoso túnel Ogarrio. El desierto wirikuta alrededor convierte cada parada en una postal.",
    ],
    gear: GEAR_AZUL,
    coords: { lat: 23.69, lng: -100.89 },
    track: [
      [23.64, -100.95],
      [23.66, -100.92],
      [23.69, -100.89],
      [23.71, -100.86],
      [23.73, -100.83],
    ],
    image: IMG.desertRoad,
    gallery: [IMG.desert, IMG.peaks, IMG.mountainRoad],
  },
  {
    slug: "valle-de-los-cirios",
    name: "Valle de los Cirios",
    region: "Cataviña",
    state: "Baja California",
    distanceKm: 96,
    elevationM: 540,
    level: "Verde",
    duration: "Una noche",
    bestSeason: "Nov – Mar",
    terrain: ["Desierto", "Brechas", "Boulders"],
    blurb:
      "Overland entre cardones gigantes y campos de roca rosada. El desierto bajacaliforniano en su forma más fotogénica.",
    description: [
      "El corredor de Cataviña, dentro del área protegida Valle de los Cirios, es puro desierto surrealista: cirios de diez metros, cardones y enormes boulders de granito rosa.",
      "Brechas suaves y firmes que cualquier 4x4 capaz disfruta, con campamento entre las rocas y pinturas rupestres a corta caminata. Overland relajado y de paisaje brutal.",
    ],
    gear: GEAR_BASE,
    coords: { lat: 29.73, lng: -114.72 },
    track: [
      [29.68, -114.78],
      [29.7, -114.75],
      [29.73, -114.72],
      [29.76, -114.69],
      [29.79, -114.66],
    ],
    image: IMG.desert,
    gallery: [IMG.desertRoad, IMG.dunes, IMG.campNight],
  },
  {
    slug: "nevado-de-toluca",
    name: "Nevado de Toluca",
    region: "Volcán Xinantécatl",
    state: "Estado de México",
    distanceKm: 22,
    elevationM: 2900,
    level: "Negro",
    duration: "Día completo",
    bestSeason: "Nov – Mar",
    terrain: ["Alta montaña", "Roca volcánica", "Hielo"],
    blurb:
      "Ascenso de roca volcánica hasta el cráter a 4,200 m. Aire delgado, hielo posible y vistas que cortan la respiración.",
    description: [
      "Pocas rutas en México llegan tan alto en vehículo. El camino al cráter del Nevado de Toluca trepa por roca volcánica suelta hasta más de 4,000 metros, junto a las lagunas del Sol y la Luna.",
      "El reto es la altitud y la temperatura: motores que pierden potencia, posible hielo en la sombra y clima que cambia en minutos. Una experiencia de alta montaña a una hora del Valle de Toluca.",
    ],
    gear: GEAR_NEGRO,
    coords: { lat: 19.1, lng: -99.76 },
    track: [
      [19.07, -99.8],
      [19.08, -99.78],
      [19.1, -99.76],
      [19.11, -99.74],
      [19.12, -99.72],
    ],
    image: IMG.alpine,
    gallery: [IMG.peaks, IMG.ridge, IMG.mountainRoad],
  },
];

export function getTrail(slug: string) {
  return trails.find((t) => t.slug === slug);
}

export const events: EventItem[] = [
  {
    id: "ev-1",
    date: "2026-09-16T07:00:00",
    title: "Salida de la Independencia — Cañón del Diablo",
    location: "Entrada Sierra San Pedro Mártir",
    level: "Negro",
    spots: 40,
    spotsLeft: 6,
    tag: "Insignia",
    routeSlug: "canon-del-diablo",
  },
  {
    id: "ev-2",
    date: "2026-09-27T08:30:00",
    title: "Convoy al Amanecer — Sierra Gorda",
    location: "Campamento base, Jalpan",
    level: "Azul",
    spots: 60,
    spotsLeft: 22,
    tag: "Para principiantes",
    routeSlug: "sierra-gorda",
  },
  {
    id: "ev-3",
    date: "2026-10-10T16:00:00",
    title: "Travesía Nocturna — Laguna Salada",
    location: "Acceso 3, Mexicali",
    level: "Verde",
    spots: 50,
    spotsLeft: 31,
    tag: "Overland",
    routeSlug: "laguna-salada",
  },
  {
    id: "ev-4",
    date: "2026-10-24T06:00:00",
    title: "Expedición Barrancas del Cobre",
    location: "Punto de reunión, Creel",
    level: "Pro",
    spots: 16,
    spotsLeft: 3,
    tag: "Avanzado",
    routeSlug: "barrancas-del-cobre",
  },
];

export const voices: Voice[] = [
  {
    quote:
      "Llegué solo con una camioneta de agencia y me fui con doce números nuevos en el celular y cero miedo a la siguiente ruta.",
    name: "Mariana Quintero",
    role: "Miembro desde 2023",
    rig: "4Runner TRD",
  },
  {
    quote:
      "Grabé mi primera ruta en la Sierra Gorda con la app, la subí y a la semana alguien más ya la había recorrido. Así de fácil funciona esto.",
    name: "Diego Salas",
    role: "Miembro desde 2022",
    rig: "Jeep JLU Rubicon",
  },
  {
    quote:
      "Reservé la travesía nocturna en la Laguna Salada por impulso. Ver la Vía Láctea reflejada en el lecho seco fue la mejor noche del año.",
    name: "Renata Ávila",
    role: "Miembro desde 2024",
    rig: "Land Cruiser 80",
  },
];

export const faqs = [
  {
    q: "¿Necesito una camioneta preparada para unirme?",
    a: "No. Las rutas Verde y Azul están diseñadas para 4x4 de agencia e incluso para crossovers AWD capaces. Calificamos cada ruta para que sepas qué necesita tu vehículo antes de inscribirte.",
  },
  {
    q: "¿Cuánto cuesta la membresía?",
    a: "La plataforma es completamente gratuita. Los eventos pueden tener una cuota definida por el organizador para cubrir permisos u otros gastos — eso lo decide quien crea el evento. Línea Brava no organiza salidas guiadas ni cobra por rutear.",
  },
  {
    q: "¿Cómo sé si una ruta es para mi nivel?",
    a: "Cada ruta tiene un nivel asignado (Verde, Azul, Negro, Pro) con la descripción del terreno, distancia, desnivel y equipo mínimo recomendado. Léela completa antes de salir — la calificación la pone quien grabó la ruta y la valida la comunidad.",
  },
  {
    q: "¿Puedo llevar acompañantes o niños?",
    a: "Depende del evento o la ruta. En rutas Verde y Azul generalmente sí. Las rutas Negro y Pro tienen condiciones técnicas que conviene revisar a detalle antes de ir con pasajeros. Cada ruta y cada evento lo especifica.",
  },
];

export const levelMeta: Record<TrailLevel, { label: string; short: string; className: string }> = {
  Verde: { label: "Verde · Fácil", short: "Verde", className: "text-go-400 border-go-500/40 bg-go-500/10" },
  Azul: { label: "Azul · Moderado", short: "Azul", className: "text-sky-300 border-sky-400/40 bg-sky-400/10" },
  Negro: { label: "Negro · Difícil", short: "Negro", className: "text-bone border-bone/30 bg-bone/10" },
  Pro: { label: "Pro · Experto", short: "Pro", className: "text-trail-300 border-trail-400/40 bg-trail-500/10" },
};

export const LEVELS: TrailLevel[] = ["Verde", "Azul", "Negro", "Pro"];
