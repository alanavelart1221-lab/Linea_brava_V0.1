"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const benefits = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 9h8M8 13h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    title: "Perfil empresarial",
    body: "Página dedicada con descripción, especialidades, fotos y botón de contacto directo para tus clientes.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M18 14l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Prospectos directos",
    body: "Los usuarios solicitan cotizaciones e información desde la app. Recibes el contacto calificado directamente.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Visibilidad prioritaria",
    body: "Aparece en los primeros resultados del directorio y en las rutas relevantes a tu zona de cobertura.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 },
  }),
};

export function ForProviders() {
  return (
    <section className="section-gap border-t border-ink-800">
      <div className="shell">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          {/* Left copy */}
          <div>
            <motion.span
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={0}
              variants={fadeUp}
              className="eyebrow mb-4 flex items-center gap-2"
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-go-400" />
              Para proveedores
            </motion.span>

            <motion.h2
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={1}
              variants={fadeUp}
              className="h2 text-bone"
            >
              ¿Tienes un taller o{" "}
              <span className="text-trail-500">distribuidora</span> de
              refacciones?
            </motion.h2>

            <motion.p
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={2}
              variants={fadeUp}
              className="mt-5 max-w-lg text-base leading-relaxed text-mute"
            >
              Línea Brava reúne a miles de entusiastas off-road activos en todo
              México. Aparece en el directorio, recibe solicitudes de cotización
              y haz crecer tu negocio con la audiencia más especializada del
              país.
            </motion.p>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={3}
              variants={fadeUp}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link href="/proveedores#planes" className="btn-primary">
                Ver planes
                <Arrow />
              </Link>
              <Link href="/proveedores" className="btn-ghost">
                Ver directorio
              </Link>
            </motion.div>
          </div>

          {/* Right: benefit cards */}
          <ul className="flex flex-col gap-4">
            {benefits.map((b, i) => (
              <motion.li
                key={b.title}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i + 1}
                variants={fadeUp}
                className="card-line flex items-start gap-5 p-6"
              >
                <span className="mt-0.5 shrink-0 text-trail-500">{b.icon}</span>
                <div>
                  <p className="font-display text-lg text-bone">{b.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-mute">{b.body}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
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
