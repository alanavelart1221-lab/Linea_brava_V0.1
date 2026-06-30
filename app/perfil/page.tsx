import { redirect } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUS_META, type OrderStatus } from "@/lib/providers";

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending: { label: "En revisión", className: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400" },
  approved: { label: "Publicada", className: "border-go-500/40 bg-go-500/10 text-go-400" },
  rejected: { label: "Rechazada", className: "border-red-500/40 bg-red-500/10 text-red-400" },
  oculta: { label: "Oculta", className: "border-red-500/40 bg-red-500/10 text-red-400" },
};

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/?login=1");

  const [{ data: routes }, { data: ordersRaw }] = await Promise.all([
    supabase
      .from("user_routes")
      .select("id, name, state, level, distance_km, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select(`
        id, status, total_mxn, created_at, paid_at,
        order_items ( id, product_name, product_image_url, unit_price, quantity, subtotal, provider_id,
          providers ( id, name )
        )
      `)
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  interface OrderRow {
    id: string;
    status: OrderStatus;
    total_mxn: number;
    created_at: string;
    paid_at: string | null;
    order_items: Array<{
      id: string;
      product_name: string;
      product_image_url: string | null;
      unit_price: number;
      quantity: number;
      subtotal: number;
      provider_id: string;
      providers: { id: string; name: string } | null;
    }>;
  }
  const orders = (ordersRaw as OrderRow[] | null) ?? [];

  const avatar = user.user_metadata?.avatar_url as string | undefined;
  const fullName = user.user_metadata?.full_name as string | undefined;

  return (
    <>
      <Navbar />
      <main className="shell pt-28 pb-20">
        {/* Profile header */}
        <div className="flex flex-col items-start gap-6 border-b border-ink-700 pb-8 sm:flex-row sm:items-center">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt={fullName ?? "Avatar"}
              className="h-20 w-20 rounded-full border-2 border-trail-500/40"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-trail-500 text-3xl font-bold text-ink-950">
              {fullName?.[0]?.toUpperCase() ?? "U"}
            </div>
          )}
          <div>
            <h1 className="font-display text-4xl text-bone">{fullName ?? "Mi perfil"}</h1>
            <p className="mt-1 text-sm text-mute">{user.email}</p>
          </div>
        </div>

        {/* App CTA — la grabación de rutas vive solo en la app móvil */}
        <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-trail-500/30 bg-trail-500/5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg text-bone">Graba tus rutas desde la app</p>
            <p className="mt-1 text-sm text-mute">
              La grabación con GPS y waypoints está en la app móvil de Línea Brava (próximamente).
              Aquí en la web ves y exploras las rutas de la comunidad.
            </p>
          </div>
          <Link href="/rutas" className="btn-ghost shrink-0">
            Explorar rutas
          </Link>
        </div>

        {/* Routes list */}
        <section className="mt-10">
          <h2 className="font-display text-3xl text-bone">Mis rutas</h2>

          {!routes || routes.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-ink-600 bg-ink-900/40 p-10 text-center">
              <p className="text-mute">Todavía no has grabado ninguna ruta.</p>
              <Link href="/mis-rutas/grabar" className="btn-primary mt-4 inline-flex">
                Grabar mi primera ruta
              </Link>
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {routes.map((r) => {
                const st = STATUS_LABEL[r.status] ?? STATUS_LABEL.pending;
                return (
                  <li
                    key={r.id}
                    className="card-line flex items-center justify-between gap-4 p-4"
                  >
                    <Link href={`/rutas/comunidad/${r.id}`} className="min-w-0 flex-1 group">
                      <p className="truncate font-medium text-bone group-hover:text-trail-400">{r.name}</p>
                      <p className="mt-0.5 text-xs text-mute">
                        {r.state} · {r.level} · {r.distance_km ? `${r.distance_km} km` : "—"}
                      </p>
                    </Link>
                    <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${st.className}`}>
                      {st.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Mis compras */}
        <section className="mt-14">
          <h2 className="font-display text-3xl text-bone">Mis compras</h2>

          {orders.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-ink-600 bg-ink-900/40 p-10 text-center">
              <p className="text-mute">Todavía no has realizado ninguna compra.</p>
              <Link href="/marketplace" className="btn-primary mt-4 inline-flex">
                Explorar marketplace
              </Link>
            </div>
          ) : (
            <ul className="mt-5 space-y-4">
              {orders.map((order) => {
                const statusMeta = ORDER_STATUS_META[order.status] ?? {
                  label: order.status,
                  className: "border-ink-600 bg-ink-800 text-mute",
                };
                const fecha = new Date(order.created_at).toLocaleDateString("es-MX", {
                  day: "numeric", month: "long", year: "numeric",
                });
                return (
                  <li key={order.id} className="card-line p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-700 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusMeta.className}`}>
                          {statusMeta.label}
                        </span>
                        <span className="text-xs text-mute">{fecha}</span>
                      </div>
                      <span className="font-display text-lg text-trail-400">
                        ${order.total_mxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                      </span>
                    </div>

                    <ul className="mt-4 flex flex-col gap-3">
                      {order.order_items.map((item) => (
                        <li key={item.id} className="flex items-center gap-3">
                          {item.product_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.product_image_url}
                              alt={item.product_name}
                              className="h-14 w-14 shrink-0 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-ink-800 text-xl">
                              📦
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-bone">{item.product_name}</p>
                            {item.providers && (
                              <Link
                                href={`/proveedores/${item.providers.id}`}
                                className="text-xs text-trail-400 hover:underline"
                              >
                                {item.providers.name}
                              </Link>
                            )}
                            <p className="text-xs text-mute">
                              {item.quantity} × ${item.unit_price.toLocaleString("es-MX")}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm text-bone">
                            ${item.subtotal.toLocaleString("es-MX")}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
