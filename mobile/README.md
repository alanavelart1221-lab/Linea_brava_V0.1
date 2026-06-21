# Línea Brava — App móvil (Expo)

MVP de la app: **iniciar sesión con Google + grabar rutas con GPS y subirlas** al mismo
backend de Supabase que usa la web (tabla `user_routes`, que auto-publica). El trazo de la
ruta se visualiza en la web (`/rutas/comunidad/[id]`).

## Requisitos
- Node 18+ y la app **Expo Go** instalada en tu teléfono (iOS/Android).

## Configuración (una vez)
1. Copia el archivo de entorno y rellénalo:
   ```bash
   cp .env.example .env
   ```
   Pon `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` (los mismos de la web).
2. En **Supabase → Authentication → URL Configuration → Redirect URLs**, agrega:
   - `lineabrava://auth-callback`
   - la URL `exp://…` que imprime `expo start` (para desarrollo con Expo Go).
   Sin esto, el login con Google no regresa a la app.

## Correr
```bash
npm install
npx expo start
```
Escanea el QR con **Expo Go**. El GPS solo funciona en un dispositivo real.

## Estructura
- `app/` — pantallas (expo-router): `index` (login/inicio), `grabar`, `mis-rutas`.
- `lib/` — `supabase.ts` (cliente), `auth.tsx` (sesión + Google), `geo.ts` (GPS/validación),
  `theme.ts` (colores de marca).

## Fuera del MVP (siguientes fases)
Mapa en la app (Mapbox offline), grabación en segundo plano, pantallas de exploración
(rutas/eventos/proveedores/foro/tips) y build nativo con EAS.
