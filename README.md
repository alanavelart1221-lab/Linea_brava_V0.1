# Linea Brava — Off-Road & Overland Community

A premium, cinematic landing site for an off-road community built around **trail meetups and events**. Dark, photographic, and motion-rich — engineered to load fast on any device.

![Stack](https://img.shields.io/badge/Next.js-15-black) ![Stack](https://img.shields.io/badge/React-19-blue) ![Stack](https://img.shields.io/badge/Tailwind-3.4-38bdf8) ![Stack](https://img.shields.io/badge/Framer_Motion-11-ff0080)

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build
npm run start      # serve the production build
npm run lint       # eslint
```

## Tech stack

| Concern | Choice | Why |
|--------|--------|-----|
| Framework | **Next.js 15** (App Router) | Static pre-rendering, image optimization, room to grow into auth/CMS/forum later |
| UI | **React 19 + TypeScript** | Component model, type safety |
| Styling | **Tailwind CSS 3** | Design tokens in `tailwind.config.ts`, zero runtime CSS |
| Motion | **Framer Motion 11** | Scroll reveals, parallax, count-ups — all reduced-motion aware |
| Fonts | **next/font** (Bebas Neue + Sora) | Self-hosted, no layout shift, no render-blocking |

## Design system

Generated and refined with the `ui-ux-pro-max` skill, then tuned for an off-road brand.

- **Pattern:** Event/Conference landing — hero w/ countdown → trails → schedule → community proof → join CTA
- **Style:** OLED-leaning dark (excellent performance, WCAG-grade contrast)
- **Color:** Deep charcoal base (`ink`), single bold **trail amber** accent (`#F59E0B`), emerald (`go`) reserved for live/active states only
- **Type:** Bebas Neue (display) + Sora (body) — bold and premium, built for adventure/event copy
- **Motion:** Cinematic but disciplined — 1–2 animated elements per view, `transform`/`opacity` only, `ease-out` curves

All tokens live in [`tailwind.config.ts`](tailwind.config.ts) and [`app/globals.css`](app/globals.css).

## Performance & accessibility

- **Fully static** — the home route pre-renders to HTML (~154 kB first-load JS).
- **`prefers-reduced-motion`** honored globally (CSS) and per-component (Framer's `useReducedMotion`): parallax, count-ups, and reveals degrade to static/fade.
- **Images** use `next/image` (AVIF/WebP, responsive `sizes`, lazy by default; hero is `priority`).
- **Keyboard-friendly:** visible focus rings, skip-to-content link, `aria` labels on icon buttons, labelled form input.
- **Textures** (topographic contours, film grain) are inline SVG data-URIs — no extra network requests.

## Project structure

```
app/
  layout.tsx        # fonts, metadata, viewport, skip link
  page.tsx          # section composition
  globals.css       # tokens, textures, reduced-motion guard
components/
  Navbar.tsx        # floating nav, scroll-aware, mobile drawer
  Hero.tsx          # parallax backdrop + staggered headline + countdown
  Countdown.tsx     # live ticking timer (hydration-safe)
  Marquee.tsx       # infinite value-prop strip
  Stats.tsx         # animated count-up metrics
  CountUp.tsx       # rAF count-up, fires on scroll-in
  FeaturedTrails.tsx# graded trail cards w/ photos + specs
  Events.tsx        # schedule with availability bars
  Community.tsx     # member testimonials
  Faq.tsx           # animated accordion
  JoinCTA.tsx       # email capture w/ validation + success state
  Footer.tsx        # links, socials
  Reveal.tsx        # scroll-reveal + stagger helpers
lib/
  data.ts           # trails, events, stats, voices, faqs (edit me)
  date.ts           # deterministic date formatting (no hydration drift)
```

## Customizing

- **Content:** everything is in [`lib/data.ts`](lib/data.ts) — trails, events, stats, testimonials, FAQs. The hero countdown reads `NEXT_RUN_ISO`.
- **Photos:** currently pulled from Unsplash via `next/image` (allow-listed in [`next.config.mjs`](next.config.mjs)). Swap the `image` URLs in `lib/data.ts` / `Hero.tsx` for your own — drop files in `public/` and reference `/your-photo.jpg`.
- **Brand color:** change the `trail` palette in [`tailwind.config.ts`](tailwind.config.ts) to re-skin the whole site.
- **Join form:** [`JoinCTA.tsx`](components/JoinCTA.tsx) validates client-side and shows a success state. Wire `onSubmit` to your email provider / CRM (e.g. a Next.js route handler or a service like Resend/Mailchimp).

## Notes

- Images depend on a network connection to Unsplash in dev. Replace with local assets in `public/` for a fully offline/self-hosted build.
