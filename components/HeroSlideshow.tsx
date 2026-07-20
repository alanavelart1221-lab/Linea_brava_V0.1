"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const SLIDES = [
  { src: "/hero/01.jpg", alt: "Bronco Raptor blanca sobre roca durante una salida nocturna" },
  { src: "/hero/03.jpg", alt: "Dos Jeep Wrangler trepando una formación rocosa bajo cielo azul" },
  { src: "/hero/04.jpg", alt: "Jeep Wrangler roja avanzando por las dunas junto al mar" },
  { src: "/hero/05.jpg", alt: "Jeep Wrangler roja bajando una zanja de tierra roja" },
  { src: "/hero/06.jpg", alt: "Jeep Wrangler roja de frente sobre terracería entre rocas" },
];

const SLIDE_MS = 6000;

export function HeroSlideshow() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, SLIDE_MS);
    return () => clearInterval(id);
  }, [reduce]);

  // Todas las fotos quedan montadas: el navegador las carga de una vez y el
  // cambio es un fundido real, sin hueco entre montaje y desmontaje.
  return (
    <div className="absolute inset-0">
      {SLIDES.map((slide, i) => {
        const active = i === index;
        return (
          <motion.div
            key={slide.src}
            className="absolute inset-0"
            initial={{ opacity: i === 0 ? 1 : 0, scale: 1.12 }}
            animate={{
              opacity: active ? 1 : 0,
              scale: reduce || !active ? 1.12 : 1,
            }}
            transition={{
              opacity: { duration: 1.2, ease: "easeInOut" },
              scale: { duration: 7.5, ease: "linear" },
            }}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              sizes="100vw"
              priority={i === 0}
              // Sin esto el navegador nunca pide las fotos ocultas (opacidad 0)
              // y el primer fundido saldría en blanco.
              loading="eager"
              className="object-cover object-center"
            />
          </motion.div>
        );
      })}

      {/* Indicador de progreso */}
      {!reduce && (
        <div
          aria-hidden="true"
          className="absolute bottom-5 right-5 flex gap-1.5 sm:bottom-7 sm:right-8"
        >
          {SLIDES.map((slide, i) => (
            <span
              key={slide.src}
              className={`h-0.5 w-6 rounded-full transition-colors duration-700 ${
                i === index ? "bg-trail-500" : "bg-bone/25"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
