import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { ESTADOS_PUBLICOS, mapProviderRow } from "@/lib/providers";
import type { ProviderRow } from "@/lib/providers";
import { TalleresContent } from "./TalleresContent";

export const dynamic = "force-dynamic";

const TALLER_COLUMNS =
  "id, name, type, estado, state, city, description, specialty, phone, email, whatsapp, website, address, servicios, marcas, social, logo_url, gallery, featured, horario, lat, lng, verificado, trial_start, trial_end, rejected_reason, info_requested, rfc";

export default async function TalleresPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("providers")
    .select(TALLER_COLUMNS)
    .eq("type", "taller")
    .in("estado", ESTADOS_PUBLICOS)
    .order("verificado", { ascending: false })
    .order("name", { ascending: true })
    .limit(200);

  const talleres = (data as ProviderRow[] | null ?? []).map(mapProviderRow);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-20">
        <div className="shell">
          {/* Encabezado */}
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="eyebrow mb-4 flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-trail-500" />
                Directorio
              </span>
              <h1 className="font-display text-5xl text-bone sm:text-6xl">Talleres 4×4</h1>
              <p className="mt-3 max-w-xl text-mute">
                Talleres especializados en vehículos 4×4 y off-road verificados por la
                comunidad Línea Brava.
              </p>
            </div>
            <Link href="/talleres/registro" className="btn-primary shrink-0">
              Registrar mi Taller
            </Link>
          </div>

          <TalleresContent talleres={talleres} />
        </div>
      </main>
      <Footer />
    </>
  );
}
