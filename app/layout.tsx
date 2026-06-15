import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Sora } from "next/font/google";
import "./globals.css";

// Display: bold, condensed, built for big adventure headlines.
const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

// Body: geometric, premium, highly legible at small sizes.
const sans = Sora({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lineabrava.mx"),
  title: {
    default: "Linea Brava — Comunidad Todoterreno y Overland",
    template: "%s · Linea Brava",
  },
  description:
    "Graba, crea y encuentra rutas off-road y eventos todoterreno en México. Línea Brava es la plataforma de la comunidad 4x4 y overland más activa del país.",
  keywords: [
    "todoterreno",
    "off-road",
    "overland",
    "comunidad 4x4",
    "rodadas 4x4",
    "rutas todoterreno México",
    "expedición",
    "Baja California",
  ],
  openGraph: {
    title: "Linea Brava — Comunidad Todoterreno y Overland",
    description:
      "Graba, crea y encuentra rutas off-road y eventos todoterreno en México. La comunidad 4x4 y overland más activa del país.",
    type: "website",
    locale: "es_MX",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#08090A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${display.variable} ${sans.variable}`}>
      <body>
        <a
          href="#trails"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-trail-500 focus:px-5 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink-950"
        >
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
