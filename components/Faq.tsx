"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { faqs } from "@/lib/data";
import { Reveal } from "./Reveal";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="shell scroll-mt-24 py-20 sm:py-28">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <span className="eyebrow">Antes de rodar</span>
          <h2 className="h-section mt-4 text-bone">
            Dudas,<br />
            <span className="text-trail-500">resueltas.</span>
          </h2>
          <p className="mt-5 max-w-xs text-mute">
            ¿Sigues con dudas? Escribe a la tripulación directamente a{" "}
            <a href="mailto:crew@lineabrava.mx" className="link-underline text-trail-400">
              crew@lineabrava.mx
            </a>
            .
          </p>
        </Reveal>

        <Reveal delay={0.1} className="divide-y divide-ink-700 border-y border-ink-700">
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-lg font-semibold text-bone">{item.q}</span>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink-600 text-trail-400 transition-transform duration-300 ${
                      isOpen ? "rotate-45" : ""
                    }`}
                    aria-hidden="true"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 5v14M5 12h14"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 pr-12 text-mute">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
