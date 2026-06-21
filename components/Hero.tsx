"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const headlineWords = ["ENCUENTRA", "TU", "PRÓXIMA", "AVENTURA."];

export function Hero({ routeCount, stateCount }: { routeCount: number; stateCount: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Subtle, GPU-friendly parallax (transform only). Disabled for reduced motion.
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "18%"]);
  const fgY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-8%"]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, reduce ? 1 : 0]);

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
  };
  const word = {
    hidden: { opacity: 0, y: reduce ? 0 : "0.5em" },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section
      id="top"
      ref={ref}
      className="grain relative flex min-h-[100svh] flex-col justify-end overflow-hidden pb-14 pt-28 sm:pb-20"
    >

      {/* Hero photo (parallax) */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 -z-10 scale-110">
        <Image
          src="https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=1920&q=85"
          alt="Jeep Wrangler negro en off-road"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </motion.div>

      {/* Grade so the headline stays readable over the lines */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/55 to-ink-950/20" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink-950/85 via-transparent to-transparent" />

      <motion.div style={{ y: fgY, opacity: fade }} className="shell relative">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.div variants={word} className="mb-6">
            <span className="eyebrow">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-go-400" />
              Comunidad todoterreno y overland · México
            </span>
          </motion.div>

          <h1 className="h-hero max-w-5xl text-bone">
            {headlineWords.map((w, i) => (
              <motion.span
                key={w}
                variants={word}
                className={`mr-[0.25em] inline-block ${
                  i === headlineWords.length - 1 ? "text-trail-500" : ""
                }`}
              >
                {w}
              </motion.span>
            ))}
          </h1>

          <motion.p
            variants={word}
            className="mt-6 max-w-xl text-base leading-relaxed text-mute sm:text-lg"
          >
            Rutas con tracks GPX, eventos de la comunidad, directorio de talleres y
            refacciones, foro y tips de manejo. Todo lo que el off-road mexicano necesita,
            en un solo lugar.
          </motion.p>

          <motion.div
            variants={word}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Link href="/rutas" className="btn-primary">
              Explorar rutas
              <Arrow />
            </Link>
          </motion.div>

          <motion.dl
            variants={word}
            className="mt-12 flex flex-wrap gap-x-10 gap-y-4 border-t border-ink-700/70 pt-7"
          >
            <Fact value={`${routeCount}`} label="Rutas calificadas" />
            <Fact value={`${stateCount}`} label="Estados" />
            <Fact value="4" label="Niveles de dificultad" />
          </motion.dl>
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: reduce ? 1 : [0.2, 1, 0.2] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-mute sm:flex"
      >
        <span className="text-[0.6rem] font-semibold uppercase tracking-[0.2em]">
          Desliza
        </span>
        <span className="h-8 w-px bg-gradient-to-b from-trail-500 to-transparent" />
      </motion.div>
    </section>
  );
}


function Fact({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="font-display text-4xl text-trail-500">{value}</dt>
      <dd className="mt-0.5 text-sm text-mute">{label}</dd>
    </div>
  );
}

function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14m0 0l-6-6m6 6l-6 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
