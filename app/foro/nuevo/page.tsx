import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { NuevoHiloForm } from "./NuevoHiloForm";
import { SignInPrompt } from "./SignInPrompt";

export default async function NuevoHiloPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-20">
        <div className="shell max-w-2xl">
          <div className="mb-10">
            <Link href="/foro" className="mb-6 flex items-center gap-2 text-sm text-mute hover:text-bone">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                <path
                  d="M19 12H5M12 5l-7 7 7 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Volver al foro
            </Link>
            <h1 className="h2 text-trail-500">Nuevo hilo</h1>
            <p className="mt-2 text-mute">Abre una conversación con la comunidad.</p>
          </div>

          {user ? <NuevoHiloForm /> : <SignInPrompt />}
        </div>
      </main>
      <Footer />
    </>
  );
}
