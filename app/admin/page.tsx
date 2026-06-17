import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { supabase, rol } = await requireAdmin();
  const esSuperadmin = rol === "superadmin";

  const [provRes, rutasRes] = await Promise.all([
    supabase
      .from("providers")
      .select("id", { count: "exact", head: true })
      .eq("status", "pendiente"),
    supabase
      .from("user_routes")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const provPendientes = provRes.count ?? 0;
  const rutasPendientes = rutasRes.count ?? 0;

  return (
    <>
      <Navbar />
      <main className="shell pt-28 pb-20">
        <div className="mb-10">
          <span className="eyebrow">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-trail-500" />
            Panel de administración
          </span>
          <h1 className="mt-3 font-display text-5xl text-bone">Centro de control</h1>
          <p className="mt-3 max-w-xl text-mute">
            Gestiona solicitudes, rutas, tips y el foro de Línea Brava.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AdminCard
            href="/admin/proveedores"
            title="Solicitudes de proveedor"
            description="Revisa y aprueba negocios que piden aparecer en el directorio."
            badge={provPendientes}
          />
          <AdminCard
            href="/admin/rutas"
            title="Rutas en revisión"
            description="Aprueba o rechaza las rutas que envía la comunidad."
            badge={rutasPendientes}
          />
          <AdminCard
            href="/admin/tips/nuevo"
            title="Publicar tip"
            description="Crea un nuevo tip para la comunidad off-road."
          />
          <AdminCard
            href="/foro"
            title="Moderar foro"
            description="Cierra o elimina hilos y respuestas desde cada conversación."
          />
          {esSuperadmin && (
            <AdminCard
              href="/admin/administradores"
              title="Administradores"
              description="Nombra o quita administradores de la plataforma."
              highlight
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function AdminCard({
  href,
  title,
  description,
  badge,
  highlight = false,
}: {
  href: string;
  title: string;
  description: string;
  badge?: number;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`card-line group relative flex flex-col gap-2 p-6 transition-colors hover:border-trail-500/50 ${
        highlight ? "border-trail-500/40 bg-trail-500/5" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-2xl text-bone group-hover:text-trail-400">
          {title}
        </h2>
        {badge !== undefined && badge > 0 && (
          <span className="shrink-0 rounded-full border border-trail-500/40 bg-trail-500/10 px-2.5 py-0.5 text-xs font-bold text-trail-400">
            {badge} pendiente{badge !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <p className="text-sm text-mute">{description}</p>
    </Link>
  );
}
