import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { getRouteStats } from "@/lib/routes-data";
import { Marquee } from "@/components/Marquee";
import { Stats } from "@/components/Stats";
import { ExploreHub } from "@/components/ExploreHub";
import { FeaturedTrails } from "@/components/FeaturedTrails";
import { Community } from "@/components/Community";
import { FeaturedTip } from "@/components/FeaturedTip";
import { ForProviders } from "@/components/ForProviders";
import { Faq } from "@/components/Faq";
import { JoinCTA } from "@/components/JoinCTA";
import { Footer } from "@/components/Footer";

export const revalidate = 60;

export default async function Home() {
  const { routeCount, stateCount } = await getRouteStats();
  return (
    <>
      <Navbar />
      <main>
        <Hero routeCount={routeCount} stateCount={stateCount} />
        <Marquee />
        <Stats />
        <ExploreHub />
        <FeaturedTrails />
        <FeaturedTip />
        <Community />
        <ForProviders />
        <Faq />
        <JoinCTA />
      </main>
      <Footer />
    </>
  );
}
