# Arquitectura — ADRs cortos

## ADR-001 · Next.js App Router como única app

Front, API y SSR en un deploy (Vercel). RSC para contenido MDX; client
components solo donde hay interacción (metrónomo, player, formularios).

## ADR-002 · Tres capas de datos, nunca mezcladas

1. **Datos de usuario** → Supabase (Postgres + RLS por `auth.uid()`).
2. **Contenido educativo** → MDX en `/content`, versionado en git. Añadir
   contenido = añadir ficheros; el build valida referencias.
3. **Datos musicales** → `/src/data` como fórmulas de intervalos. Las
   herramientas calculan posiciones; nada hardcodeado.

## ADR-003 · shadcn/ui vendorizado a mano

El registry (ui.shadcn.com) no es accesible desde el entorno de build remoto,
así que los componentes viven en `src/components/ui` como código propio
(que es además la filosofía de shadcn). Se editan libremente.

## ADR-004 · Enarmonías por deletreo de grados

`transpose(root, interval)` avanza la letra según el grado y deduce la
alteración por semitonos: en Fa mayor sale Sib (no La#) sin tablas de casos.
Toda la teoría es pura y testeada (`src/lib/music`).

## ADR-005 · Audio con lookahead scheduling

El metrónomo agenda golpes con el reloj de WebAudio/Tone.js por delante del
tiempo real (nunca `setInterval` para audio). La UI se sincroniza leyendo el
tiempo agendado. La lógica de patrones (acentos, subdivisiones, auto-incremento)
es pura y testeada; Tone.js solo dispara.

## ADR-006 · Estado de herramientas en la URL

`/escalas?root=C&type=major`, `/metronomo?bpm=80&sig=4/4`. Permite que las
lecciones enlacen configuraciones exactas (deep links) y que todo sea
compartible. Zustand solo para estado efímero (transporte del metrónomo, timers).

## ADR-007 · Modo demo sin Supabase

Sin variables de entorno la app funciona para desarrollo y preview (sin
persistencia). Evita que el onboarding del repo dependa de credenciales.
