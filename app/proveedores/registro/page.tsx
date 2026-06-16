import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { RegistroForm } from "./RegistroForm";
import { SignInPrompt } from "./SignInPrompt";

export default async function RegistroProveedorPage() {
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
            <Link href="/proveedores" className="mb-6 flex items-center gap-2 text-sm text-mute hover:text-bone">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                <path
                  d="M19 12H5M12 5l-7 7 7 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Volver al directorio
            </Link>
            <span className="eyebrow mb-4 flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-trail-500" />
              Para negocios
            </span>
            <h1 className="h2 text-trail-500">Solicita tu registro</h1>
            <p className="mt-3 text-mute">
              Llena los datos de tu negocio off-road. Revisamos cada solicitud antes de
              publicarla en el directorio.
            </p>
          </div>

          {user ? <RegistroForm /> : <SignInPrompt />}
        </div>
      </main>
      <Footer />
    </>
  );
}
