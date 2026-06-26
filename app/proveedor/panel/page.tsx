import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import {
  ESTADO_META,
  PRECIO_SUSCRIPCION_MXN,
  PROVIDER_COLUMNS,
  QUOTE_ESTADO_META,
  TYPE_META,
  diasRestantesPrueba,
  esVisiblePublico,
  fmtFechaCorta,
  mapProviderRow,
  type Provider,
  type ProviderEstado,
  type ProviderPayment,
  type ProviderProduct,
  type ProviderPromotion,
  type ProviderRow,
  type ProviderService,
  type ProviderSubscription,
  type QuoteRequest,
} from "@/lib/providers";
import { ProductForm } from "./ProductForm";
import { DeleteProductButton } from "./DeleteProductButton";
import { ServicioForm } from "./ServicioForm";
import { DeleteServiceButton } from "./DeleteServiceButton";
import { QuoteEstadoControls } from "./QuoteEstadoControls";
import { PromocionForm } from "./PromocionForm";
import { DeletePromocionButton } from "./DeletePromocionButton";
import { TogglePromocionButton } from "./TogglePromocionButton";
import { PerfilForm } from "./PerfilForm";
import { ReenviarButton } from "./ReenviarButton";
import { ActivarSuscripcionButton } from "./ActivarSuscripcionButton";

export const dynamic = "force-dynamic";

type Seccion =
  | "perfil"
  | "productos"
  | "servicios"
  | "proyectos"
  | "cotizaciones"
  | "promociones"
  | "estadisticas"
  | "suscripcion";

const NAV: { id: Seccion; label: string }[] = [
  { id: "perfil", label: "Mi Perfil" },
  { id: "productos", label: "Productos" },
  { id: "servicios", label: "Servicios" },
  { id: "proyectos", label: "Proyectos" },
  { id: "cotizaciones", label: "Cotizaciones" },
  { id: "promociones", label: "Promociones" },
  { id: "estadisticas", label: "Estadísticas" },
  { id: "suscripcion", label: "Mi Suscripción" },
];

const PUEDE_REENVIAR: ProviderEstado[] = ["borrador", "info_pendiente", "rechazado"];

function fmtFecha(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ProveedorPanelPage({
  searchParams,
}: {
  searchParams: Promise<{ seccion?: string }>;
}) {
  const { seccion: seccionRaw } = await searchParams;
  const seccion: Seccion = NAV.some((n) => n.id === seccionRaw)
    ? (seccionRaw as Seccion)
    : "perfil";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // El proveedor del usuario actual (cualquier estado), el más reciente.
  const { data: row } = await supabase
    .from("providers")
    .select(PROVIDER_COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ProviderRow>();

  if (!row) {
    return (
      <>
        <Navbar />
        <main className="shell pt-28 pb-20">
          <div className="rounded-2xl border border-dashed border-ink-600 bg-ink-900/40 p-14 text-center">
            <h1 className="font-display text-3xl text-bone">Panel de proveedor</h1>
            <p className="mx-auto mt-3 max-w-md text-mute">
              Aún no tienes un negocio registrado. Envía tu solicitud y, una vez
              aprobada, aquí podrás administrar tu negocio.
            </p>
            <Link href="/proveedores/registro" className="btn-primary mt-6 inline-block">
              Solicitar registro
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const provider: Provider = mapProviderRow(row);
  const meta = TYPE_META[provider.type];
  const estadoMeta = ESTADO_META[provider.estado];

  return (
    <>
      <Navbar />
      <main className="shell pt-28 pb-20">
        {/* Encabezado */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="eyebrow">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-trail-500" />
              Panel de proveedor
            </span>
            <h1 className="mt-3 font-display text-5xl text-bone">{provider.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${estadoMeta.className}`}>
                {estadoMeta.label}
              </span>
              {meta && (
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}>
                  {meta.label}
                </span>
              )}
              <span className="text-sm text-mute">
                {provider.city}, {provider.state}
              </span>
            </div>
          </div>
          {esVisiblePublico(provider.estado) && (
            <Link href={`/proveedores/${provider.id}`} className="btn-ghost">
              Ver mi perfil público
            </Link>
          )}
        </div>

        <EstadoBanner provider={provider} />

        <div className="mt-8 grid gap-10 lg:grid-cols-[220px_1fr]">
          {/* Navegación lateral */}
          <nav className="flex flex-row flex-wrap gap-2 lg:flex-col lg:gap-1">
            {NAV.map((n) => {
              const active = n.id === seccion;
              return (
                <Link
                  key={n.id}
                  href={`/proveedor/panel?seccion=${n.id}`}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-trail-500/15 text-trail-300"
                      : "text-mute hover:bg-ink-800 hover:text-bone"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          {/* Contenido */}
          <div className="min-w-0">
            {seccion === "perfil" && (
              <Section title="Mi Perfil">
                <PerfilForm provider={provider} />
              </Section>
            )}

            {seccion === "productos" && <ProductosSection providerId={provider.id} />}

            {seccion === "suscripcion" && <SuscripcionSection provider={provider} />}

            {seccion === "servicios" && <ServiciosSection providerId={provider.id} />}

            {seccion === "cotizaciones" && <CotizacionesSection providerId={provider.id} />}

            {seccion === "promociones" && <PromocionesSection providerId={provider.id} />}

            {seccion === "estadisticas" && <EstadisticasSection providerId={provider.id} />}

            {seccion === "proyectos" && (
              <Stub title="Proyectos" detalle="Pronto podrás mostrar tus proyectos y trabajos realizados." />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-6 font-display text-3xl text-bone">{title}</h2>
      {children}
    </section>
  );
}

function Stub({ title, detalle }: { title: string; detalle: string }) {
  return (
    <Section title={title}>
      <div className="rounded-2xl border border-dashed border-ink-600 bg-ink-900/40 p-14 text-center">
        <span className="inline-block rounded-full border border-trail-500/40 bg-trail-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-trail-400">
          Próximamente
        </span>
        <p className="mx-auto mt-4 max-w-sm text-mute">{detalle}</p>
      </div>
    </Section>
  );
}

/** Banner contextual según el estado del proveedor. */
function EstadoBanner({ provider }: { provider: Provider }) {
  const dias = diasRestantesPrueba(provider.trial_end);

  if (provider.estado === "pendiente") {
    return (
      <Banner tono="info">
        Tu solicitud está en revisión. Te avisaremos en cuanto sea aprobada.
      </Banner>
    );
  }
  if (provider.estado === "info_pendiente") {
    return (
      <Banner tono="warn" action={<ReenviarButton providerId={provider.id} />}>
        <strong className="text-bone">El administrador pidió más información:</strong>{" "}
        {provider.info_requested ?? "Completa tu información y reenvía tu solicitud."}
      </Banner>
    );
  }
  if (provider.estado === "rechazado") {
    return (
      <Banner tono="error" action={<ReenviarButton providerId={provider.id} />}>
        <strong className="text-bone">Tu solicitud fue rechazada.</strong>{" "}
        {provider.rejected_reason ?? "Revisa tu información e inténtalo de nuevo."}
      </Banner>
    );
  }
  if (provider.estado === "suspendido") {
    return (
      <Banner tono="error" action={<ActivarSuscripcionButton />}>
        Tu prueba terminó y tu perfil dejó de aparecer en el directorio. Activa la
        suscripción de ${PRECIO_SUSCRIPCION_MXN} MXN/mes para volver.
      </Banner>
    );
  }
  if (provider.estado === "en_prueba" && dias != null) {
    const tono = dias <= 5 ? "warn" : "info";
    return (
      <Banner tono={tono} action={<ActivarSuscripcionButton />}>
        Prueba gratuita: te quedan <strong className="text-bone">{dias} día{dias !== 1 ? "s" : ""}</strong>.
        Vence el {fmtFecha(provider.trial_end)}.
      </Banner>
    );
  }
  return null;
}

function Banner({
  tono,
  action,
  children,
}: {
  tono: "info" | "warn" | "error";
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const clase =
    tono === "error"
      ? "border-red-500/30 bg-red-500/10"
      : tono === "warn"
      ? "border-amber-500/30 bg-amber-500/10"
      : "border-trail-500/30 bg-trail-500/5";
  return (
    <div className={`flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ${clase}`}>
      <p className="text-sm text-mute">{children}</p>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

async function ProductosSection({ providerId }: { providerId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("provider_products")
    .select("id, provider_id, name, description, price, currency, image_url, created_at")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });
  const products = (data as ProviderProduct[] | null) ?? [];

  return (
    <Section title="Productos">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="card-line h-fit p-6">
          <h3 className="mb-5 font-display text-xl text-bone">Agregar producto</h3>
          <ProductForm providerId={providerId} />
        </div>
        <div>
          <h3 className="mb-5 font-display text-xl text-bone">
            Mi tienda <span className="text-base font-normal text-mute">({products.length})</span>
          </h3>
          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink-600 bg-ink-900/40 p-10 text-center">
              <p className="text-mute">Aún no has agregado productos.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {products.map((p) => (
                <li key={p.id} className="card-line flex items-center gap-4 p-4">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt={p.name} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-ink-800 text-xs text-mute/40">
                      Sin foto
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-bone">{p.name}</p>
                    {p.price != null && (
                      <p className="text-sm text-trail-500">
                        ${p.price.toLocaleString("es-MX")} {p.currency}
                      </p>
                    )}
                  </div>
                  <DeleteProductButton productId={p.id} providerId={providerId} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Section>
  );
}

async function ServiciosSection({ providerId }: { providerId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("provider_services")
    .select("id, provider_id, name, description, price, currency, created_at")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });
  const servicios = (data as ProviderService[] | null) ?? [];

  return (
    <Section title="Servicios">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="card-line h-fit p-6">
          <h3 className="mb-5 font-display text-xl text-bone">Agregar servicio</h3>
          <ServicioForm providerId={providerId} />
        </div>
        <div>
          <h3 className="mb-5 font-display text-xl text-bone">
            Mis servicios <span className="text-base font-normal text-mute">({servicios.length})</span>
          </h3>
          {servicios.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink-600 bg-ink-900/40 p-10 text-center">
              <p className="text-mute">Aún no has agregado servicios.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {servicios.map((s) => (
                <li key={s.id} className="card-line flex items-start gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-bone">{s.name}</p>
                    {s.description && (
                      <p className="mt-1 text-sm text-mute">{s.description}</p>
                    )}
                    {s.price != null && (
                      <p className="mt-1 text-sm text-trail-500">
                        ${s.price.toLocaleString("es-MX")} {s.currency}
                      </p>
                    )}
                  </div>
                  <DeleteServiceButton serviceId={s.id} providerId={providerId} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Section>
  );
}

async function CotizacionesSection({ providerId }: { providerId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quote_requests")
    .select("id, provider_id, user_id, nombre, contacto, mensaje, estado, created_at")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });
  const cotizaciones = (data as QuoteRequest[] | null) ?? [];

  return (
    <Section title="Cotizaciones">
      {cotizaciones.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-600 bg-ink-900/40 p-14 text-center">
          <p className="text-mute">
            Aún no has recibido solicitudes de cotización. Aparecerán aquí cuando un
            miembro te contacte desde tu perfil.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {cotizaciones.map((q) => {
            const meta = QUOTE_ESTADO_META[q.estado];
            return (
              <li key={q.id} className="card-line p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-bone">{q.nombre}</span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-trail-400">{q.contacto}</p>
                    <p className="mt-3 max-w-2xl text-sm text-mute">{q.mensaje}</p>
                    <p className="mt-2 text-xs text-mute/60">{fmtFechaCorta(q.created_at)}</p>
                  </div>
                  <QuoteEstadoControls quoteId={q.id} estado={q.estado} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

async function PromocionesSection({ providerId }: { providerId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("provider_promotions")
    .select("id, provider_id, titulo, descripcion, descuento, fecha_inicio, fecha_fin, activo, created_at")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });
  const promos = (data as ProviderPromotion[] | null) ?? [];

  return (
    <Section title="Promociones">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="card-line h-fit p-6">
          <h3 className="mb-5 font-display text-xl text-bone">Nueva promoción</h3>
          <PromocionForm providerId={providerId} />
        </div>
        <div>
          <h3 className="mb-5 font-display text-xl text-bone">
            Mis promociones <span className="text-base font-normal text-mute">({promos.length})</span>
          </h3>
          {promos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink-600 bg-ink-900/40 p-10 text-center">
              <p className="text-mute">Aún no has creado promociones.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {promos.map((p) => (
                <li key={p.id} className="card-line p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-bone">{p.titulo}</span>
                        {p.descuento && (
                          <span className="rounded-full border border-trail-500/40 bg-trail-500/10 px-2 py-0.5 text-xs font-semibold text-trail-400">
                            {p.descuento}
                          </span>
                        )}
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                          p.activo
                            ? "border-go-500/40 bg-go-500/10 text-go-400"
                            : "border-ink-500/50 bg-ink-700/40 text-mute"
                        }`}>
                          {p.activo ? "Activa" : "Inactiva"}
                        </span>
                      </div>
                      {p.descripcion && (
                        <p className="mt-1.5 text-sm text-mute">{p.descripcion}</p>
                      )}
                      {(p.fecha_inicio || p.fecha_fin) && (
                        <p className="mt-1 text-xs text-mute/60">
                          {p.fecha_inicio ? fmtFechaCorta(p.fecha_inicio) : "Sin inicio"} →{" "}
                          {p.fecha_fin ? fmtFechaCorta(p.fecha_fin) : "Sin fin"}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <TogglePromocionButton promoId={p.id} providerId={providerId} activo={p.activo} />
                      <DeletePromocionButton promoId={p.id} providerId={providerId} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Section>
  );
}

async function EstadisticasSection({ providerId }: { providerId: string }) {
  const supabase = await createClient();
  const desde30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Conteos (cada uno por su cuenta para poder filtrar por tipo/fecha).
  const [
    vistasTotal,
    vistas30,
    contactosTotal,
    contactos30,
    cotizacionesTotal,
    cotizaciones30,
    productos,
    servicios,
    promosActivas,
  ] = await Promise.all([
    supabase.from("provider_events").select("id", { count: "exact", head: true }).eq("provider_id", providerId).eq("tipo", "vista"),
    supabase.from("provider_events").select("id", { count: "exact", head: true }).eq("provider_id", providerId).eq("tipo", "vista").gte("created_at", desde30),
    supabase.from("provider_events").select("id", { count: "exact", head: true }).eq("provider_id", providerId).eq("tipo", "contacto"),
    supabase.from("provider_events").select("id", { count: "exact", head: true }).eq("provider_id", providerId).eq("tipo", "contacto").gte("created_at", desde30),
    supabase.from("quote_requests").select("id", { count: "exact", head: true }).eq("provider_id", providerId),
    supabase.from("quote_requests").select("id", { count: "exact", head: true }).eq("provider_id", providerId).gte("created_at", desde30),
    supabase.from("provider_products").select("id", { count: "exact", head: true }).eq("provider_id", providerId),
    supabase.from("provider_services").select("id", { count: "exact", head: true }).eq("provider_id", providerId),
    supabase.from("provider_promotions").select("id", { count: "exact", head: true }).eq("provider_id", providerId).eq("activo", true),
  ]);

  return (
    <Section title="Estadísticas">
      <p className="mb-6 text-sm text-mute">
        Actividad de tu perfil. Las vistas y contactos no cuentan tus propias visitas.
      </p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Metrica label="Vistas de perfil" valor={vistasTotal.count ?? 0} sub={`${vistas30.count ?? 0} en 30 días`} />
        <Metrica label="Contactos" valor={contactosTotal.count ?? 0} sub={`${contactos30.count ?? 0} en 30 días`} />
        <Metrica label="Cotizaciones" valor={cotizacionesTotal.count ?? 0} sub={`${cotizaciones30.count ?? 0} en 30 días`} />
        <Metrica label="Productos" valor={productos.count ?? 0} />
        <Metrica label="Servicios" valor={servicios.count ?? 0} />
        <Metrica label="Promociones activas" valor={promosActivas.count ?? 0} />
      </div>
    </Section>
  );
}

function Metrica({ label, valor, sub }: { label: string; valor: number; sub?: string }) {
  return (
    <div className="card-line p-5">
      <p className="text-xs uppercase tracking-widest text-mute">{label}</p>
      <p className="mt-2 font-display text-4xl text-bone">{valor.toLocaleString("es-MX")}</p>
      {sub && <p className="mt-1 text-xs text-trail-400">{sub}</p>}
    </div>
  );
}

async function SuscripcionSection({ provider }: { provider: Provider }) {
  const supabase = await createClient();
  const { data: sub } = await supabase
    .from("provider_subscriptions")
    .select("id, provider_id, status, gateway, price_mxn, period_start, period_end, trial_end, created_at")
    .eq("provider_id", provider.id)
    .maybeSingle<ProviderSubscription>();

  const { data: paysData } = await supabase
    .from("provider_payments")
    .select("id, provider_id, amount_mxn, currency, status, paid_at, created_at")
    .eq("provider_id", provider.id)
    .order("created_at", { ascending: false });
  const pagos = (paysData as ProviderPayment[] | null) ?? [];

  const dias = diasRestantesPrueba(provider.trial_end);
  const estadoMeta = ESTADO_META[provider.estado];
  const enPrueba = provider.estado === "en_prueba";
  const vencimiento = enPrueba ? provider.trial_end : sub?.period_end ?? null;

  return (
    <Section title="Mi Suscripción">
      <div className="grid gap-6 sm:grid-cols-2">
        <Dato label="Estado">
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${estadoMeta.className}`}>
            {estadoMeta.label}
          </span>
        </Dato>
        <Dato label="Precio">
          <span className="text-bone">${PRECIO_SUSCRIPCION_MXN} MXN / mes</span>
        </Dato>
        {enPrueba && (
          <Dato label="Días restantes de prueba">
            <span className="text-bone">{dias ?? 0} día{dias !== 1 ? "s" : ""}</span>
          </Dato>
        )}
        <Dato label={enPrueba ? "Vence la prueba" : "Próximo cobro"}>
          <span className="text-bone">{fmtFecha(vencimiento)}</span>
        </Dato>
      </div>

      {provider.estado !== "activo" && (
        <div className="mt-8">
          <ActivarSuscripcionButton />
          <p className="mt-3 text-xs text-mute">
            El cobro automático con Stripe / Mercado Pago se habilitará próximamente.
          </p>
        </div>
      )}

      {/* Historial de pagos */}
      <div className="mt-12">
        <h3 className="mb-4 font-display text-xl text-bone">Historial de pagos</h3>
        {pagos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-600 bg-ink-900/40 p-10 text-center">
            <p className="text-mute">Sin pagos todavía.</p>
          </div>
        ) : (
          <ul className="divide-y divide-ink-700 rounded-2xl border border-ink-700">
            {pagos.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-mute">{fmtFecha(p.paid_at ?? p.created_at)}</span>
                <span className="text-bone">
                  ${p.amount_mxn.toLocaleString("es-MX")} {p.currency}
                </span>
                <span className="text-mute">{p.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}

function Dato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="card-line p-5">
      <p className="text-xs uppercase tracking-widest text-mute">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
