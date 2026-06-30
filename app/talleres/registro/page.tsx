import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { RegistroTallerForm } from "./RegistroTallerForm";
import { SignInPrompt } from "@/app/proveedores/registro/SignInPrompt";

export default async function RegistroTallerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-20">
        <div className="shell max-w-2xl">
          <div className="mb-10">
            <Link
              href="/talleres"
              className="mb-6 flex items-center gap-2 text-sm text-mute hover:text-bone"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                <path
                  d="M19 12H5M12 5l-7 7 7 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Volver a Talleres
            </Link>
            <span className="eyebrow mb-4 flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-trail-500" />
              Para talleres
            </span>
            <h1 className="h2 text-trail-500">Registra tu taller</h1>
            <p className="mt-3 text-mute">
              Llena los datos de tu taller 4×4. Revisamos cada solicitud antes de
              publicarla en el directorio.
            </p>
          </div>

          {user ? <RegistroTallerForm /> : <SignInPrompt />}
        </div>
      </main>
      <Footer />
    </>
  );
}
