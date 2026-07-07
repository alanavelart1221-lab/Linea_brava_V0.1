  # CLAUDE.md

# Línea Brava — Contexto permanente del proyecto

> Este archivo proporciona el contexto permanente del proyecto para Claude Code.
> Antes de implementar cambios, léelo completo.

---

# Visión del proyecto

Línea Brava es un ecosistema digital para la comunidad Off-Road de México.

Está compuesto por:

- Sitio web
- Aplicación móvil
- Canal de YouTube
- Comunidad
- Plataforma de proveedores

El objetivo es crear la comunidad Off-Road más completa de México y conectar usuarios con proveedores especializados.

---

# Objetivo del producto

La aplicación móvil es el principal gancho para atraer usuarios.

El sitio web complementa la experiencia con:

- Directorio de proveedores
- Panel para proveedores
- Tips
- Foro
- Eventos
- Administración

Los usuarios nunca pagan.

Los proveedores pagan una suscripción de $500 MXN mensuales después de un periodo promocional de 2 meses gratuitos.

---

# Estado del proyecto

El proyecto se encuentra en etapa MVP.

No todas las funcionalidades están definidas.

Cuando exista incertidumbre:

- Proponer alternativas.
- Explicar ventajas y desventajas.
- No asumir arquitectura definitiva.

Siempre priorizar simplicidad.

---

# Público objetivo

Usuarios de vehículos 4x4, Overlanding, Side by Side y ATV.

Muchos utilizan la aplicación sin cobertura celular.

La aplicación debe diseñarse bajo una filosofía **Offline First**.

---

# Ecosistema

## Sitio web

Responsabilidades:

- Landing principal.
- Directorio de proveedores.
- Foro.
- Eventos.
- Tips.
- Panel de proveedores.
- Panel administrativo.

Debe incentivar constantemente la descarga de la aplicación.

## Aplicación móvil

Es el corazón del ecosistema.

Debe permitir:

- Descubrir rutas.
- Descargar rutas.
- Navegación GPS.
- Mapas offline.
- Grabar recorridos.
- Convertir recorridos en rutas.
- Crear waypoints personalizados.
- Fotografías.
- Notas.
- Sincronización cuando exista Internet.

La sección Tips permanece únicamente en la web.

## YouTube

Genera tráfico hacia la plataforma.

Los videos pueden ser creados utilizando IA.

---

# Sistema de rutas

Existen:

- Rutas de la comunidad.
- Rutas verificadas.

Los usuarios pueden:

- Descargar.
- Navegar.
- Calificar.
- Comentar.

Las rutas verificadas son aprobadas por administradores considerando calidad y calificaciones.

---

# Proveedores

Cada proveedor dispone de un panel privado.

Debe poder administrar:

- Información.
- Productos.
- Servicios.
- Fotografías.
- Contacto.

## Importación automática

Objetivo importante del proyecto:

Evitar capturar manualmente cientos de productos.

Siempre explorar integraciones con:

- Amazon
- Mercado Libre
- Shopify
- WooCommerce
- Sitios propios

Si no existe integración, permitir captura manual.

---

# Filosofía de diseño

La plataforma debe sentirse:

- Moderna.
- Premium.
- Minimalista.
- Rápida.

Nunca saturar pantallas.

Menos es más.

---

# Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- Supabase
- Leaflet (web)

No agregar dependencias sin autorización.

---

# Lo que YA funciona (NO romper)

- Login Google mediante Supabase.
- Middleware de autenticación.
- Callback OAuth.
- Foro conectado a Supabase.
- Panel administrativo.
- Flujo de aprobación de rutas.

No refactorizar estas áreas sin autorización.

---

# Sistema de diseño

Utilizar exclusivamente:

- ink-*
- trail-*
- go-*
- bone
- mute

No utilizar colores HEX directamente.

Tipografías:

- font-display
- font-sans

---

# Reglas de trabajo

- Cambios pequeños.
- No modificar archivos no relacionados.
- Mostrar un plan antes de cambios grandes.
- Mantener toda la interfaz en español.
- Ejecutar build o typecheck cuando sea posible.

---

# Filosofía de desarrollo

El proyecto es desarrollado por una sola persona.

Priorizar:

1. Simplicidad.
2. Mantenibilidad.
3. Legibilidad.
4. MVP antes que perfección.

No realizar sobreingeniería.

---

# Cómo debe pensar Claude

Antes de implementar una funcionalidad:

- Pensar como Product Manager.
- Pensar como desarrollador senior.
- Proponer mejoras cuando agreguen valor.
- No cambiar arquitectura sin preguntar.
- Explicar ventajas y desventajas cuando existan varias alternativas.

---

# Decisiones pendientes

Todavía NO están definidas completamente:

- Marketplace definitivo.
- Sincronización automática de inventarios.
- Roadmap de eventos.
- Funciones premium futuras.

No asumir decisiones definitivas.
