export type ProviderType = "taller" | "distribuidor" | "guia" | "eventos" | "equipo";

// Ciclo de vida del proveedor (enum `proveedor_estado` en Supabase).
export type ProviderEstado =
  | "borrador"
  | "pendiente"
  | "info_pendiente"
  | "en_prueba"
  | "activo"
  | "suspendido"
  | "rechazado";

// Precio de la suscripción mensual de proveedor (MXN).
export const PRECIO_SUSCRIPCION_MXN = 500;

// Redes sociales del proveedor (columna `social` jsonb).
export interface ProviderSocial {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
}

export interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  estado: ProviderEstado;
  state: string;
  city: string;
  description: string;
  specialty: string[];
  // Contacto
  phone: string;
  email: string | null;
  whatsapp: string | null;
  website?: string | null;
  // Ubicación y oferta
  address: string | null;
  servicios: string[];
  marcas: string[];
  social: ProviderSocial;
  // Medios
  logo_url: string | null;
  gallery: string[];
  featured: boolean;
  // Taller: horario, coords y verificación (admin-only)
  horario?: string | null;
  lat?: number | null;
  lng?: number | null;
  verificado?: boolean;
  // Prueba / suscripción / moderación
  trial_start: string | null;
  trial_end: string | null;
  rejected_reason: string | null;
  info_requested: string | null;
  // Fiscal
  rfc?: string | null;
}

// Producto / accesorio de la tienda de un proveedor (tabla `provider_products`).
export interface ProviderProduct {
  id: string;
  provider_id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  image_url: string | null;
  created_at: string;
  // Campos de marketplace
  external_url: string | null;
  source_platform: string;   // 'manual' | 'mercadolibre' | 'web'
  source_id: string | null;
  category: string | null;
  stock: number | null;      // null = sin límite
  active: boolean;
}

// Producto del marketplace enriquecido con datos del proveedor (join en el feed).
export interface MarketplaceProduct extends ProviderProduct {
  provider_name: string;
  provider_logo_url: string | null;
  provider_type: ProviderType;
}

// Fuente de catálogo importado (tabla `provider_catalog_sources`).
export interface CatalogSource {
  id: string;
  provider_id: string;
  url: string;
  platform: "mercadolibre" | "web";
  seller_id_or_store: string | null;
  last_synced_at: string | null;
  product_count: number;
  status: "pendiente" | "ok" | "error";
  error_message: string | null;
  created_at: string;
}

// Orden de compra (tabla `orders`).
export type OrderStatus = "pendiente" | "pagado" | "enviando" | "entregado" | "cancelado";

export interface Order {
  id: string;
  buyer_id: string;
  status: OrderStatus;
  total_mxn: number;
  shipping_address: ShippingAddress;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  mp_status: string | null;
  created_at: string;
  paid_at: string | null;
}

export interface ShippingAddress {
  nombre: string;
  calle: string;
  colonia: string;
  ciudad: string;
  estado: string;
  cp: string;
  telefono: string;
}

// Ítem de una orden (tabla `order_items`).
export interface OrderItem {
  id: string;
  order_id: string;
  provider_id: string;
  product_id: string | null;
  product_name: string;
  product_image_url: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

// Metadatos de estado de orden para mostrar en UI.
export const ORDER_STATUS_META: Record<OrderStatus, { label: string; className: string }> = {
  pendiente:  { label: "Pendiente de pago", className: "border-trail-500/40 bg-trail-500/10 text-trail-400" },
  pagado:     { label: "Pagado",            className: "border-go-500/40 bg-go-500/10 text-go-400" },
  enviando:   { label: "En camino",         className: "border-blue-500/40 bg-blue-500/10 text-blue-400" },
  entregado:  { label: "Entregado",         className: "border-go-500/40 bg-go-500/15 text-go-300" },
  cancelado:  { label: "Cancelado",         className: "border-ink-500/50 bg-ink-700/40 text-mute" },
};

// Categorías del marketplace.
export const MARKETPLACE_CATEGORIES = [
  { id: "todos",        label: "Todos" },
  { id: "partes",       label: "Partes y Refacciones" },
  { id: "accesorios",   label: "Accesorios" },
  { id: "equipamiento", label: "Equipamiento Overland" },
  { id: "neumaticos",   label: "Llantas y Neumáticos" },
  { id: "herramientas", label: "Herramientas" },
  { id: "otros",        label: "Otros" },
] as const;

export type MarketplaceCategoryId = typeof MARKETPLACE_CATEGORIES[number]["id"];

// Servicio del proveedor (tabla `provider_services`).
export interface ProviderService {
  id: string;
  provider_id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  created_at: string;
}

// Promoción / descuento del proveedor (tabla `provider_promotions`).
export interface ProviderPromotion {
  id: string;
  provider_id: string;
  titulo: string;
  descripcion: string | null;
  descuento: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  activo: boolean;
  created_at: string;
}

// Estado de una solicitud de cotización.
export type QuoteEstado = "nueva" | "atendida" | "descartada";

// Solicitud de cotización (tabla `quote_requests`).
export interface QuoteRequest {
  id: string;
  provider_id: string;
  user_id: string | null;
  nombre: string;
  contacto: string;
  mensaje: string;
  estado: QuoteEstado;
  created_at: string;
}

export const QUOTE_ESTADO_META: Record<QuoteEstado, { label: string; className: string }> = {
  nueva:      { label: "Nueva",      className: "border-trail-500/40 bg-trail-500/10 text-trail-400" },
  atendida:   { label: "Atendida",   className: "border-go-500/40 bg-go-500/10 text-go-400" },
  descartada: { label: "Descartada", className: "border-ink-500/50 bg-ink-700/40 text-mute" },
};

// Suscripción del proveedor (tabla `provider_subscriptions`).
export interface ProviderSubscription {
  id: string;
  provider_id: string;
  status: "trialing" | "active" | "past_due" | "canceled";
  gateway: "stripe" | "mercadopago" | null;
  price_mxn: number;
  period_start: string | null;
  period_end: string | null;
  trial_end: string | null;
  created_at: string;
}

// Pago registrado (tabla `provider_payments`). Vacío hasta integrar la pasarela.
export interface ProviderPayment {
  id: string;
  provider_id: string;
  amount_mxn: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded";
  paid_at: string | null;
  created_at: string;
}

// Notificación / recordatorio (tabla `notifications`).
export interface Notification {
  id: string;
  user_id: string;
  provider_id: string | null;
  tipo: string;
  titulo: string;
  cuerpo: string | null;
  url: string | null;
  leido: boolean;
  created_at: string;
}

export const TYPE_META: Record<ProviderType, { label: string; className: string }> = {
  taller:      { label: "Taller 4×4",             className: "border-blue-500/40 bg-blue-500/10 text-blue-400" },
  distribuidor:{ label: "Distribuidora",           className: "border-purple-500/40 bg-purple-500/10 text-purple-400" },
  guia:        { label: "Guía de Ruta",            className: "border-go-500/40 bg-go-500/10 text-go-400" },
  eventos:     { label: "Organizador de Eventos",  className: "border-trail-500/40 bg-trail-500/10 text-trail-400" },
  equipo:      { label: "Equipo Overland",         className: "border-orange-500/40 bg-orange-500/10 text-orange-400" },
};

// Etiqueta y estilo (chip) por estado del proveedor. Usa tokens del sistema:
// trail = prueba, go = activo, rojo = suspendido/rechazado, ámbar tenue = en revisión.
export const ESTADO_META: Record<ProviderEstado, { label: string; className: string }> = {
  borrador:       { label: "Borrador",              className: "border-ink-500/50 bg-ink-700/40 text-mute" },
  pendiente:      { label: "Pendiente de aprobación", className: "border-trail-500/40 bg-trail-500/10 text-trail-400" },
  info_pendiente: { label: "Información pendiente",  className: "border-amber-500/40 bg-amber-500/10 text-amber-400" },
  en_prueba:      { label: "En prueba",             className: "border-trail-500/50 bg-trail-500/15 text-trail-300" },
  activo:         { label: "Activo",                className: "border-go-500/40 bg-go-500/10 text-go-400" },
  suspendido:     { label: "Suspendido",            className: "border-red-500/40 bg-red-500/10 text-red-400" },
  rechazado:      { label: "Rechazado",             className: "border-red-500/40 bg-red-500/10 text-red-400" },
};

// ¿El proveedor es visible públicamente en el directorio?
export function esVisiblePublico(estado: ProviderEstado): boolean {
  return estado === "en_prueba" || estado === "activo";
}

// Estados públicos, para queries (.in("estado", ESTADOS_PUBLICOS)).
export const ESTADOS_PUBLICOS: ProviderEstado[] = ["en_prueba", "activo"];

// Formatea una fecha ISO a "5 mar 2026" (es-MX). Devuelve "—" si es null.
export function fmtFechaCorta(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Días restantes de prueba (redondeados hacia arriba). null si no hay prueba.
// Devuelve 0 si ya venció.
export function diasRestantesPrueba(trialEnd: string | null): number | null {
  if (!trialEnd) return null;
  const ms = new Date(trialEnd).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

// Columnas de `providers` necesarias para construir un `Provider` en el cliente.
export const PROVIDER_COLUMNS =
  "id, name, type, estado, state, city, description, specialty, phone, email, whatsapp, website, address, servicios, marcas, social, logo_url, gallery, featured, horario, lat, lng, verificado, trial_start, trial_end, rejected_reason, info_requested, rfc";

// Fila cruda de Supabase (columnas nullable). Se mapea con `mapProviderRow`.
export interface ProviderRow {
  id: string;
  name: string;
  type: string;
  estado: ProviderEstado;
  state: string;
  city: string;
  description: string;
  specialty: string[] | null;
  phone: string;
  email: string | null;
  whatsapp: string | null;
  website: string | null;
  address: string | null;
  servicios: string[] | null;
  marcas: string[] | null;
  social: ProviderSocial | null;
  logo_url: string | null;
  gallery: string[] | null;
  featured: boolean;
  horario: string | null;
  lat: number | null;
  lng: number | null;
  verificado: boolean;
  trial_start: string | null;
  trial_end: string | null;
  rejected_reason: string | null;
  info_requested: string | null;
  rfc: string | null;
}

// Normaliza una fila de Supabase al modelo `Provider` que usa la UI.
export function mapProviderRow(p: ProviderRow): Provider {
  return {
    id: p.id,
    name: p.name,
    type: p.type as ProviderType,
    estado: p.estado,
    state: p.state,
    city: p.city,
    description: p.description,
    specialty: p.specialty ?? [],
    phone: p.phone,
    email: p.email,
    whatsapp: p.whatsapp,
    website: p.website ?? undefined,
    address: p.address,
    servicios: p.servicios ?? [],
    marcas: p.marcas ?? [],
    social: p.social ?? {},
    logo_url: p.logo_url,
    gallery: p.gallery ?? [],
    featured: p.featured,
    horario: p.horario,
    lat: p.lat,
    lng: p.lng,
    verificado: p.verificado,
    trial_start: p.trial_start,
    trial_end: p.trial_end,
    rejected_reason: p.rejected_reason,
    info_requested: p.info_requested,
    rfc: p.rfc,
  };
}

// Los proveedores reales viven en Supabase (tabla `providers`) y se cargan en
// `app/proveedores/page.tsx`. Este arreglo queda vacío a propósito: no hay
// proveedores de ejemplo. La página de detalle de ruta lo usa como respaldo y
// ya muestra un estado vacío cuando no hay coincidencias.
export const providers: Provider[] = [];
