import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { TYPE_META } from "@/lib/providers";
import type { ProviderType, ProviderProduct } from "@/lib/providers";
import { ProductForm } from "./ProductForm";
import { DeleteProductButton } from "./DeleteProductButton";

export const dynamic = "force-dynamic";

type ProviderRow = {
  id: string;
  name: string;
  type: string;
  state: string;
  city: string;
  phone: string;
  status: string;
};

export default async function ProveedorPanelPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // El proveedor aprobado del usuario actual (RLS deja ver el propio).
  const { data: provider } = await supabase
    .from("providers")
    .select("id, name, type, state, city, phone, status")
    .eq("user_id", user.id)
    .eq("status", "aprobado")
    .order("approved_at", { ascending: false })
    .limit(1)
    .maybeSingle<ProviderRow>();

  // Si no hay proveedor aprobado, mostramos un estado informativo.
  if (!provider) {
    return (
      <>
        <Navbar />
        <main className="shell pt-28 pb-20">
          <div className="rounded-2xl border border-dashed border-ink-600 bg-ink-900/40 p-14 text-center">
            <h1 className="font-display text-3xl text-bone">Panel de proveedor</h1>
            <p className="mx-auto mt-3 max-w-md text-mute">
              Aún no tienes un negocio aprobado. Envía tu solicitud y, una vez
              aprobada, aquí podrás administrar tu tienda.
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

  const { data: productsData } = await supabase
    .from("provider_products")
    .select("id, provider_id, name, description, price, currency, image_url, created_at")
    .eq("provider_id", provider.id)
    .order("created_at", { ascending: false });

  const products = (productsData as ProviderProduct[] | null) ?? [];
  const meta = TYPE_META[provider.type as ProviderType];

  return (
    <>
      <Navbar />
      <main className="shell pt-28 pb-20">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="eyebrow">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-trail-500" />
              Panel de proveedor
            </span>
            <h1 className="mt-3 font-display text-5xl text-bone">{provider.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
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
          <Link
            href={`/proveedores/${provider.id}`}
            className="btn-ghost"
          >
            Ver mi perfil público
          </Link>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          {/* Alta de producto */}
          <section className="card-line h-fit p-6">
            <h2 className="mb-5 font-display text-2xl text-bone">Agregar producto</h2>
            <ProductForm providerId={provider.id} />
          </section>

          {/* Lista de productos */}
          <section>
            <h2 className="mb-5 font-display text-2xl text-bone">
              Mi tienda{" "}
              <span className="text-base font-normal text-mute">
                ({products.length})
              </span>
            </h2>
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
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="h-16 w-16 shrink-0 rounded-lg object-cover"
                      />
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
                    <DeleteProductButton productId={p.id} providerId={provider.id} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
