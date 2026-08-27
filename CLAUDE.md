# Trastea

App web de estudio de guitarra: curso diario por lecciones, metrónomo, escalas,
acordes, tabs, wiki y registro de progreso. Nombre = _trastes_ + _trastear_:
tono cercano y juguetón en los textos, herramienta seria y precisa.

## Stack

Next.js 15+ App Router + TS estricto · Tailwind v4 + shadcn/ui (componentes
vendorizados en `src/components/ui`, sin CLI) · Supabase (Auth, Postgres+RLS,
Storage) · TanStack Query + Zustand (solo estado efímero) · Web Audio directo (`src/lib/audio`,
lookahead scheduling propio, nunca `setInterval` para el sonido) · MDX en `/content` · datos musicales
por fórmulas en `/src/data` · Vitest + Testing Library · Playwright (E2E).

## Comandos

- `pnpm dev` / `pnpm build`
- `pnpm test` / `pnpm test:watch`
- `pnpm lint` / `pnpm typecheck` / `pnpm format`
- `pnpm content:audit` — inventario y validación de `/content` → `content/STATE.md`
- `pnpm check` — lint + typecheck + test + content:audit (todo debe estar verde)

## Reglas innegociables

- **Nada está terminado sin `pnpm check` en verde.**
- TDD: primero el test que especifica el requisito, luego la implementación.
- TS `strict`, `any` prohibido. Tipos de dominio (`NoteName`, `LessonSlug`, `Bpm`).
- Lógica pura separada del render (música, scheduler, SRS, rachas) y testeada.
- Commits convencionales y atómicos.
- Sin dependencias nuevas sin justificación.
- Datos de usuario en DB · contenido educativo en MDX · datos musicales en
  `/src/data`. **Nunca mezclar las tres cosas.**
- Accesibilidad WCAG 2.1 AA: teclado completo, foco visible, contraste,
  `prefers-reduced-motion`.

## Mapa de carpetas

```
/content            curso (módulos/semanas/lecciones-día), ejercicios, canciones,
                    tabs, wiki, quizzes, seed. Ver /content/README allí mismo.
/supabase/migrations SQL versionado (RLS en todas las tablas)
/src/app            rutas App Router (dashboard /, /hoy, /curso, /metronomo, …)
/src/components/ui  shadcn/ui vendorizado
/src/components     componentes de la app
/src/lib/music      lógica musical pura (notas, intervalos, enarmonías)
/src/lib/supabase   clientes tipados + middleware
/src/data           escalas/acordes/afinaciones por fórmula de intervalos
/scripts            content-audit y tooling
```

## Contenido

- El estado de las herramientas vive en la URL (query params) para deep links
  desde lecciones (`/metronomo?bpm=80`, `/escalas?root=C&type=major`).
- Frontmatter validado con zod en build; slug referenciado inexistente = build rojo.
- Skills `add-lesson`, `add-wiki` y `content-curator` en `.claude/skills`.
- El catálogo de canciones (`/content/songs`) es la **fuente de repertorio del
  curso**: se consulta por técnica, nivel, estilo y colección, no por título.
  Vocabulario cerrado en `src/lib/content/song-taxonomy.ts` (valor fuera del
  enum = build rojo) y filtrado puro en `song-filter.ts`. Ver "Canciones" en
  `content/README.md` antes de añadir fichas.
- El curso **no termina en 12 semanas**: el tronco (A, B, C) está hecho y la
  hoja de ruta son especialidades de años (blues, jazz, rock, fingerstyle,
  funk, fusión, flamenco, improvisación, directo, mantenimiento). Ver
  "Currículo a largo plazo" en `content/BACKLOG.md` antes de planear contenido.
