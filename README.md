# Línea Brava — Comunidad Off-Road & Overland

Plataforma para la comunidad todoterreno / 4x4 de **México**. Reúne en un solo
lugar **rutas, eventos, proveedores, foro y tips**, con autenticación y datos en
Supabase. Tema oscuro (OLED), acento ámbar y animaciones cuidadas.

![Next.js](https://img.shields.io/badge/Next.js-15-black) ![React](https://img.shields.io/badge/React-19-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8) ![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ecf8e)

## Qué es

Una **plataforma funcional balanceada** (no una landing): las cinco secciones
pesan por igual. Toda la interfaz va en español.

- **Rutas** — catálogo calificado por dificultad y terreno, con tracks GPX.
- **Eventos** — salidas en grupo; los miembros crean e inscriben.
- **Proveedores** — talleres, autopartes y guías (modelo de membresía).
- **Foro** — hilos, respuestas, likes e imágenes.
- **Tips** — guías de manejo, mantenimiento y equipo.

## Stack

| Área | Elección |
|------|----------|
| Framework | Next.js 15 (App Router) |
| UI | React 19 + TypeScript |
| Estilos | Tailwind CSS 3 (tokens en `tailwind.config.ts` y `app/globals.css`) |
| Animación | Framer Motion 11 (respeta `prefers-reduced-motion`) |
| Backend | Supabase — auth, base de datos y storage (`@supabase/ssr`) |
| Mapas | Leaflet + react-leaflet |
| Fuentes | next/font — Bebas Neue (títulos) + Sora (cuerpo) |

## Arranque rápido

```bash
npm install
cp .env.local.example .env.local   # y rellena tus llaves de Supabase
npm run dev                        # http://localhost:3000
```

Otros scripts:

```bash
npm run build      # build de producción
npm run start      # sirve el build
npm run lint       # eslint
```

## Variables de entorno

Crea `.env.local` en la raíz con tus credenciales de Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

> Sin estas variables, el login y las secciones que leen de Supabase (foro,
> admin) no funcionan.

## Configuración de Supabase

1. **Auth → Providers:** habilita **Google** y agrega como redirect URL
   `http://localhost:3000/auth/callback` (y la de producción cuando despliegues).
2. **Tablas** usadas por el código actual: `profiles` (con `is_admin`),
   `forum_threads`, `forum_replies`, `forum_thread_likes`, `forum_reply_likes`,
   `user_routes` (con `status` para el flujo de aprobación).
3. **Storage:** crea el bucket `forum-images` (imágenes del foro).
4. Activa **RLS** en cada tabla y define sus políticas.

## Estructura del proyecto

```
app/
  layout.tsx              # fuentes, metadata, layout base
  page.tsx                # composición de la home (plataforma)
  globals.css             # tokens, texturas, guard de reduced-motion
  auth/callback/route.ts  # intercambio del código OAuth de Google
  rutas/                  # catálogo, detalle y navegación de rutas
  eventos/                # listado y creación de eventos
  proveedores/            # directorio y planes de membresía
  foro/                   # hilos, detalle, nuevo hilo (Supabase)
  tips/                   # tips publicados por admin
  perfil/                 # perfil del usuario
  mis-rutas/grabar/       # grabación de recorrido
  admin/                  # panel de admin (rutas y tips), con rol
components/               # UI reutilizable (Navbar, Hero, ExploreHub, etc.)
lib/
  supabase/server.ts      # cliente Supabase (servidor)
  supabase/client.ts      # cliente Supabase (navegador)
  data.ts                 # DATOS DE EJEMPLO: rutas, eventos, stats
  providers.ts            # DATOS DE EJEMPLO: proveedores
  date.ts                 # formato de fechas sin hydration drift
middleware.ts             # refresca la sesión de Supabase
```

## Composición de la home

`Hero` → `ExploreHub` (las 5 secciones con peso igual) → `FeaturedTrails` →
`Events` → `FeaturedTip` → `ForProviders` → `Footer`.

> Los componentes de la landing anterior (`Marquee`, `Stats`, `Community`,
> `Faq`, `JoinCTA`) siguen en `components/` pero ya no se usan en la home.

## Autenticación y datos

- **Login con Google** vía Supabase (`@supabase/ssr`). El `middleware.ts` refresca
  la sesión y `app/auth/callback/route.ts` cierra el flujo OAuth.
- **Foro:** funcional contra Supabase (hilos, respuestas, likes e imágenes).
- **Admin:** verificación de rol y aprobación de rutas de usuarios.
- **Datos de ejemplo:** rutas, eventos, stats y proveedores aún viven en
  `lib/data.ts` y `lib/providers.ts`. Pendiente migrarlos a Supabase.

## Roles (diseño objetivo)

Hoy el código usa un booleano `is_admin`. El diseño hacia el que se va a migrar:
un enum `rol` (`usuario` / `proveedor` / `admin`) en `profiles`, más
`estado_proveedor` (`pendiente` / `aprobado`), todo protegido con RLS. El usuario
común nunca paga; la membresía es para proveedores (talleres y autopartes).

## Personalización

- **Contenido de ejemplo:** edita `lib/data.ts` y `lib/providers.ts`.
- **Color de marca:** cambia la paleta `trail` en `tailwind.config.ts` para
  re-skinear todo el sitio.
- **Imágenes:** por ahora se usan placeholders de Unsplash (dominios permitidos
  en `next.config.mjs`). Reemplázalas por archivos en `public/` y referencia
  `/tu-foto.jpg`.

## Estado actual

| Listo | Pendiente |
|-------|-----------|
| Auth con Google | Migrar datos de ejemplo a Supabase |
| Foro (Supabase) | Sistema de 3 roles (`rol` + `estado_proveedor`) |
| Panel de admin + aprobación de rutas | Membresía/cobro a proveedores |
| Home como plataforma | App móvil (React Native / Flutter) |
