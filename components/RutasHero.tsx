"use client";

import dynamic from "next/dynamic";

const LiquidCrystal = dynamic(
  () => import("@/components/ui/liquid-crystal").then((m) => m.LiquidCrystal),
  { ssr: false }
);

const SHADER_PROPS = {
  hue: 35,
  speed: 0.3,
  noise: 0.15,
  warp: 0.06,
  zoom: 2.0,
  brightness: 0.38,
};

export function RutasHero() {
  return (
    <>
      <div className="absolute inset-0 -z-10">
        <LiquidCrystal {...SHADER_PROPS} />
      </div>
      <div className="absolute inset-0 -z-10 bg-ink-950/70" />
    </>
  );
}
