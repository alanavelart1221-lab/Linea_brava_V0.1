import { requireAdmin } from "@/lib/auth";

// Guardia única para todo /admin/*: si no es admin ni superadmin, redirige.
// Cada página conserva su propio Navbar/Footer.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <>{children}</>;
}
