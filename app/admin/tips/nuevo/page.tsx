import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { NuevoTipForm } from "../NuevoTipForm";

export default async function NuevoTipPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/");

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-20">
        <div className="shell max-w-2xl">
          <div className="mb-10">
            <span className="eyebrow mb-4 flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-trail-500" />
              Admin
            </span>
            <h1 className="h2 text-bone">Nuevo tip</h1>
            <p className="mt-3 text-mute">
              Se publica de inmediato en la sección de tips.
            </p>
          </div>
          <NuevoTipForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
