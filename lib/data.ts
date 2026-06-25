export type TrailLevel = "Verde" | "Azul" | "Negro" | "Pro";


export interface EventItem {
  id: string;
  date: string; // ISO
  title: string;
  location: string;
  level: TrailLevel;
  spots: number;
  spotsLeft: number;
  tag: string;
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

export const voices: Voice[] = [
  {
    quote:
      "Encontré un taller en el directorio que conocía mi Patrol de memoria. En tres días tenía el diferencial listo y el precio fue justo. No lo hubiera encontrado por mi cuenta.",
    name: "Mariana Quintero",
    role: "Miembro desde 2023",
    rig: "Nissan Patrol Y61",
  },
  {
    quote:
      "Pregunté en el foro si mi 4Runner de agencia aguantaba la ruta a Real de Catorce. En una hora ya tenía cinco respuestas con tips de presión de llanta y todo. Eso no lo da ningún grupo de WhatsApp.",
    name: "Diego Salas",
    role: "Miembro desde 2022",
    rig: "Toyota 4Runner TRD",
  },
  {
    quote:
      "Grabé mi primera ruta en la Sierra Gorda, la subí a la plataforma y a la semana alguien más ya la había recorrido con el track que compartí. Así de fácil funciona esto.",
    name: "Renata Ávila",
    role: "Miembro desde 2024",
    rig: "Jeep JLU Rubicon",
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
