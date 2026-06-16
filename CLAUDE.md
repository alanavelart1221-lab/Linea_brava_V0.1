# Línea Brava — Contexto del proyecto

Este archivo le da a Claude Code el contexto permanente del proyecto. Léelo
al inicio de cada sesión y respétalo. Si algo aquí entra en conflicto con una
petición puntual, avísame antes de proceder.

## Qué es Línea Brava

Plataforma para la comunidad off-road / 4x4 en **México**. Reúne en un solo
lugar: **rutas, eventos, proveedores (talleres y autopartes), foro y tips**.
Toda la interfaz va **en español**. Producto desarrollado por una sola persona.

Es una **plataforma funcional balanceada**, no una landing de marketing: las
cinco secciones (rutas, eventos, proveedores, foro, tips) pesan por igual.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 3** (tokens en `tailwind.config.ts` y `app/globals.css`)
- **Framer Motion 11** para animaciones
- **Supabase** (base de datos, auth y storage) vía `@supabase/ssr`
- **Leaflet / react-leaflet** para mapas (web)

No agregues dependencias nuevas sin preguntarme primero.

## Estructura

- `app/` — rutas del App Router. Server Components por defecto; usa
  `"use client"` solo cuando de verdad se necesite (estado, efectos, eventos).
- `components/` — componentes de UI reutilizables.
- `lib/` — utilidades y datos. Supabase en `lib/supabase/server.ts` (servidor)
  y `lib/supabase/client.ts` (cliente).
- `lib/data.ts` y `lib/providers.ts` — **datos de ejemplo (placeholder)** de
  rutas, eventos, stats y proveedores. Pendiente migrarlos a Supabase.

## Lo que YA funciona — NO romper

Trata estas áreas con cuidado; no las refactorices salvo que te lo pida explícito:

- **Login con Google (Supabase):** `lib/supabase/server.ts`,
  `lib/supabase/client.ts`, `middleware.ts` y `app/auth/callback/route.ts`.
  El middleware refresca la sesión — no quites esa llamada.
- **Foro:** `app/foro/**` y `app/foro/actions.ts`. Escribe de verdad a Supabase
  (tablas `forum_threads`, `forum_replies`, `forum_thread_likes`,
  `forum_reply_likes`; bucket de storage `forum-images`).
- **Panel de admin:** `app/admin/**`, con verificación de rol y flujo de
  aprobación de rutas (`user_routes` con `status`).

## Sistema de diseño (respétalo siempre)

Colores (en `tailwind.config.ts`) — nunca uses hex sueltos, usa los tokens:

- `ink-*` — base oscura (fondos).
- `trail-*` — ámbar, **único acento** (CTAs, detalles).
- `go-*` — esmeralda, **solo** para estados en vivo/activos.
- `bone` — texto principal. `mute` — texto secundario.

Tipografía: `font-display` (Bebas Neue) para títulos, `font-sans` (Sora) para
cuerpo. `h1`–`h3` ya reciben la display por base; no la reasignes.

Clases utilitarias propias (en `app/globals.css`): `.shell` (contenedor),
`.eyebrow`, `.card-line` (tarjetas), `.btn-primary`, `.btn-ghost`,
`.input-field`, `.link-underline`, `.topo`, `.grain`.

Animaciones: usa los wrappers `Reveal` / `RevealGroup` de `components/Reveal.tsx`.
Respeta siempre `prefers-reduced-motion` (esos wrappers ya lo hacen).

## Reglas de trabajo

- **Haz cambios mínimos y acotados.** No refactorices código no relacionado ni
  toques archivos que no te pedí.
- **Muéstrame un plan o el diff antes** de cambios amplios o de varios archivos.
- Cuando dudes entre dos enfoques, explícame ambos y déjame elegir; no decidas
  arquitectura por tu cuenta.
- Sigue las convenciones y tokens existentes; que lo nuevo se vea igual a lo que ya hay.
- Mantén todo el texto de UI **en español**.
- Corre `npm run build` (o el typecheck) después de cambiar código cuando se pueda.

## Decisiones tomadas (no las revivas sin avisar)

- **Roles:** el diseño objetivo es un enum `rol` (`usuario` / `proveedor` /
  `admin`) en la tabla `profiles`, más `estado_proveedor` (`pendiente` /
  `aprobado`). El código actual usa solo un booleano `is_admin`; al implementar
  roles, migra hacia el diseño objetivo y protege todo con **RLS** en Supabase.
- **Monetización:** membresía a **proveedores** (talleres y autopartes); los
  usuarios comunes nunca pagan. Gratis al inicio, cobro después.
- **Mapas:** Leaflet sirve para la web por ahora. **Mapbox** es la elección para
  el objetivo offline de la app; **no cambies Leaflet por otra cosa** sin pedírtelo.
- **App móvil:** se hará después (React Native o Flutter), reusando este backend
  de Supabase. Por ahora el repo es solo la web.
