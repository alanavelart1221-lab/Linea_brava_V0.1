"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Reveal } from "./Reveal";

type Status = "idle" | "error" | "success";

export function JoinCTA() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) {
      setStatus("error");
      return;
    }
    // Front-end demo: wire this to your CRM / email provider.
    setStatus("success");
  }

  return (
    <section id="join" className="shell scroll-mt-24 py-20 sm:py-28">
      <Reveal>
        <div className="grain relative overflow-hidden rounded-[2rem] border border-ink-700 bg-ink-900 p-8 sm:p-14">
          {/* Amber glow + topo backdrop */}
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-trail-500/20 blur-3xl"
            aria-hidden="true"
          />
          <div className="topo absolute inset-0 -z-0 opacity-50" aria-hidden="true" />

          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <span className="eyebrow">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-go-400" />
                Gratis · Ninguna camioneta es demasiado básica
              </span>
              <h2 className="h-section mt-4 max-w-xl text-bone">
                Tu próxima ruta está<br />
                <span className="text-trail-500">a un clic.</span>
              </h2>
              <p className="mt-5 max-w-md text-mute">
                Déjanos tu correo y te avisamos cuando haya rutas o eventos nuevos cerca
                de ti, más la checklist de preparación que recibe cada nuevo miembro.
              </p>
            </div>

            <div>
              {status === "success" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-xl2 border border-go-500/40 bg-go-500/10 p-8 text-center"
                >
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-go-500/20">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="#34D399"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p className="font-display text-2xl text-bone">¡Ya estás en la lista!</p>
                  <p className="mt-2 text-sm text-mute">
                    Revisa tu correo — la checklist de preparación va en camino.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={onSubmit} noValidate className="card-line p-6 sm:p-7">
                  <label
                    htmlFor="join-email"
                    className="mb-2 block text-sm font-medium text-bone"
                  >
                    Correo electrónico
                  </label>
                  <input
                    id="join-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === "error") setStatus("idle");
                    }}
                    placeholder="tu@correo.mx"
                    aria-invalid={status === "error"}
                    aria-describedby={status === "error" ? "join-error" : undefined}
                    className={`w-full rounded-xl border bg-ink-950 px-4 py-3.5 text-bone placeholder:text-mute/70 transition-colors focus:outline-none ${
                      status === "error"
                        ? "border-trail-500"
                        : "border-ink-600 focus:border-trail-400"
                    }`}
                  />
                  {status === "error" && (
                    <p id="join-error" className="mt-2 text-sm text-trail-400">
                      Ingresa un correo válido para poder contactarte.
                    </p>
                  )}
                  <button type="submit" className="btn-primary mt-4 w-full">
                    Avisarme de rutas y eventos
                  </button>
                  <p className="mt-3 text-center text-xs text-mute">
                    Sin spam. Cancela cuando quieras.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
