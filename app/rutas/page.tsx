import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RoutesExplorer } from "@/components/RoutesExplorer";
import { Reveal } from "@/components/Reveal";
import { RutasHero } from "@/components/RutasHero";
import { getApprovedRoutes, toListItem } from "@/lib/routes-data";

export const metadata: Metadata = {
  title: "Rutas todoterreno en México",
  description:
    "Explora y filtra rutas todoterreno y overland calificadas por dificultad en todo México: Baja California, Querétaro, Chihuahua, San Luis Potosí y más.",
};

export const revalidate = 60;

export default async function RutasPage() {
  const items = (await getApprovedRoutes()).map(toListItem);

  return (
    <>
      <Navbar />
      <main>
        <section className="grain relative overflow-hidden border-b border-ink-700 pb-10 pt-32 sm:pt-36">
          <RutasHero />

          <div className="shell">
            <Reveal>
              <span className="eyebrow">El catálogo</span>
              <h1 className="h-section mt-4 max-w-3xl text-trail-500">
                Encuentra tu próxima<br />
                aventura.
              </h1>
              <p className="mt-5 max-w-xl text-mute">
                Cada ruta está explorada, calificada y clasificada por dificultad. Filtra
                por nivel o estado y abre cualquiera para ver el mapa, las fotos y el equipo
                que necesitas.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="shell py-12">
          <RoutesExplorer items={items} />
        </section>
      </main>
      <Footer />
    </>
  );
}
