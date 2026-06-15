import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { Stats } from "@/components/Stats";
import { FeaturedTrails } from "@/components/FeaturedTrails";
import { Community } from "@/components/Community";
import { FeaturedTip } from "@/components/FeaturedTip";
import { ForProviders } from "@/components/ForProviders";
import { Faq } from "@/components/Faq";
import { JoinCTA } from "@/components/JoinCTA";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <Stats />
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
