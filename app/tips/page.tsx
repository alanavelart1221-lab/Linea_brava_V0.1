import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { TipsGrid } from "@/components/TipsGrid";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;

export default async function TipsPage() {
  const supabase = await createClient();

  const [{ data: tips }, { data: { user } }] = await Promise.all([
    supabase.from("tips").select("*").order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("rol")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.rol === "admin";
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-20">
        <div className="shell">
          <Reveal className="mb-12">
            <span className="eyebrow mb-4 flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-trail-500" />
              Conocimiento del camino
            </span>
            <h1 className="h2 text-trail-500">Tips off-road</h1>
            <p className="mt-4 max-w-xl text-mute">
              Mecánica, equipo, navegación y seguridad. Todo lo que necesitas saber
              antes de meterte al terreno.
            </p>
          </Reveal>

          <TipsGrid tips={tips ?? []} isAdmin={isAdmin} />
        </div>
      </main>
      <Footer />
    </>
  );
}
