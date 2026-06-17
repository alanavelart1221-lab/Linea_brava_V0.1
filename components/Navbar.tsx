"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AuthButton } from "./AuthButton";

const links = [
  { href: "/rutas", label: "Rutas" },
  { href: "/eventos", label: "Eventos" },
  { href: "/tips", label: "Tips" },
  { href: "/proveedores", label: "Proveedores" },
  { href: "/foro", label: "Foro" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [modoProveedor, setModoProveedor] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Modo proveedor (cookie lb_modo): muestra acceso a su panel. Las rutas/eventos
  // siguen disponibles; al cambiar a modo usuario el proveedor las usa normal.
  useEffect(() => {
    const m = document.cookie
      .split("; ")
      .find((c) => c.startsWith("lb_modo="))
      ?.split("=")[1];
    setModoProveedor(m === "proveedor");
  }, []);

  const navLinks = modoProveedor
    ? [{ href: "/proveedor/panel", label: "Mi negocio" }, ...links]
    : links;

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-4 sm:pt-4">
      <motion.nav
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`flex w-full max-w-content items-center justify-between rounded-full border px-4 py-2.5 transition-colors duration-300 sm:px-5 ${
          scrolled
            ? "border-ink-700 bg-ink-900/80 backdrop-blur-xl"
            : "border-transparent bg-transparent"
        }`}
      >
        <Link href="/" className="flex items-center gap-2.5" aria-label="Inicio Linea Brava">
          <LogoMark />
          <span className="font-display text-xl tracking-tightest text-bone">
            LINEA BRAVA
          </span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="link-underline text-sm font-medium text-mute transition-colors hover:text-bone"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          <AuthButton />
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-600 text-bone md:hidden cursor-pointer"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
        >
          <span className="relative block h-3.5 w-5">
            <span
              className={`absolute left-0 block h-0.5 w-5 bg-current transition-all duration-300 ${
                open ? "top-1.5 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute left-0 top-1.5 block h-0.5 w-5 bg-current transition-all duration-300 ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 block h-0.5 w-5 bg-current transition-all duration-300 ${
                open ? "top-1.5 -rotate-45" : "top-3"
              }`}
            />
          </span>
        </button>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="absolute left-3 right-3 top-[4.5rem] rounded-3xl border border-ink-700 bg-ink-900/95 p-4 backdrop-blur-xl md:hidden"
          >
            <ul className="flex flex-col gap-1">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-4 py-3 text-base font-medium text-bone hover:bg-ink-800"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              <li className="mt-2 border-t border-ink-700 pt-3">
                <AuthButton />
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function LogoMark() {
  return (
    <svg
      width="96"
      height="32"
      viewBox="0 0 200 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Left mountain — back layer */}
      <polyline
        points="12,60 52,14 84,44"
        stroke="#F59E0B"
        strokeWidth="7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Right mountain — middle layer */}
      <polyline
        points="116,44 152,16 188,60"
        stroke="#F59E0B"
        strokeWidth="7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Center mountain — front layer (tallest) */}
      <polyline
        points="72,44 100,4 128,44"
        stroke="#F59E0B"
        strokeWidth="7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
