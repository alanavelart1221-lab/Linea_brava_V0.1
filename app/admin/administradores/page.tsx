import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { requireSuperadmin } from "@/lib/auth";
import type { Rol } from "@/lib/auth";
import { AdminToggle } from "./AdminToggle";

export const dynamic = "force-dynamic";

type UsuarioFila = {
  id: string;
  email: string;
  rol: Rol;
  estado_proveedor: "pendiente" | "aprobado" | null;
};

const ROL_META: Record<Rol, { label: string; className: string }> = {
  superadmin: {
    label: "Superadmin",
    className: "border-trail-500/40 bg-trail-500/10 text-trail-400",
  },
  admin: {
    label: "Admin",
    className: "border-go-500/40 bg-go-500/10 text-go-400",
  },
  proveedor: {
    label: "Proveedor",
    className: "border-ink-600 bg-ink-900 text-mute",
  },
  usuario: {
    label: "Usuario",
    className: "border-ink-600 bg-ink-900 text-mute",
  },
};

export default async function AdminAdministradoresPage() {
  const { supabase } = await requireSuperadmin();

  const { data, error } = await supabase.rpc("admin_list_users");
  const usuarios = (data as UsuarioFila[] | null) ?? [];

  return (
    <>
      <Navbar />
      <main className="shell pt-28 pb-20">
        <div className="mb-8">
          <span className="eyebrow">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-trail-500" />
            Panel de administración
          </span>
          <h1 className="mt-3 font-display text-5xl text-bone">Administradores</h1>
          <p className="mt-3 max-w-xl text-mute">
            Nombra o quita administradores. Solo tú (superadmin) puedes hacerlo.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/5 p-14 text-center">
            <p className="text-lg text-red-400">No se pudo cargar la lista de usuarios.</p>
            <p className="mt-2 text-sm text-mute">{error.message}</p>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-600 bg-ink-900/40 p-14 text-center">
            <p className="text-lg text-mute">Aún no hay usuarios registrados.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {usuarios.map((u) => {
              const meta = ROL_META[u.rol] ?? ROL_META.usuario;
              const esSuper = u.rol === "superadmin";
              return (
                <li key={u.id} className="card-line p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium text-bone">{u.email}</span>
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}>
                          {meta.label}
                        </span>
                        {u.estado_proveedor === "aprobado" && (
                          <span className="rounded-full border border-ink-600 bg-ink-900 px-2.5 py-0.5 text-xs text-mute">
                            Proveedor aprobado
                          </span>
                        )}
                      </div>
                    </div>
                    {esSuper ? (
                      <span className="shrink-0 text-xs text-mute/60">No editable</span>
                    ) : (
                      <AdminToggle userId={u.id} isAdmin={u.rol === "admin"} />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <Footer />
    </>
  );
}
