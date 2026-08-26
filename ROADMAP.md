# Roadmap

## Fase 0 — Fundación ✅ (en curso)

- [x] Scaffolding Next.js 15+ / TS strict / Tailwind v4
- [x] shadcn/ui vendorizado (18 componentes)
- [x] Migración inicial Supabase con RLS + tipos + clientes + middleware
- [x] Lógica musical pura + datos por fórmulas (tests)
- [x] Tooling: Vitest, Prettier, ESLint+a11y, CI
- [ ] Deploy en Vercel (requiere cuenta del usuario)
- [ ] Storybook (pospuesto a Fase 2 junto a `<Fretboard />`)

## Fase 0.5 — Sistema de diseño ✅ parcial

- [x] Tokens y dirección visual inicial en `DESIGN.md` (oscuro, ámbar, números display)
- [ ] Revisión de direcciones alternativas con el plugin `frontend-design` (requiere sesión local)

## Fase 1 — MVP usable para practicar ✅

- [x] Auth + onboarding (nivel → lección de inicio)
- [x] Curso completo: módulos A, B y C — 60 lecciones-día desde el seed
- [x] Player de lección: checklist de bloques, timers, metrónomo embebido, registro bpm, completar → sesión
- [x] `/hoy` + modo focus
- [x] Metrónomo completo (tap, acentos, solo 2y4, auto-incremento, presets URL)
- [x] Dashboard: racha, progreso, últimos bpm
- [x] Wiki con 48 fichas en profundidad + buscador
- [x] `content:audit` + `STATE.md` en CI

## Fase 2 — Herramientas visuales + resto del curso (en curso)

- [x] `<Fretboard />` SVG + Escalas y Acordes con audio y deep links
- [x] Acordes: diagramas verticales de todas las formas tocables + tríadas
- [x] Módulos B y C completos (40 lecciones-día)
- [x] Canciones con ficha completa (`/canciones`)
- [ ] Tablaturas con AlphaTab (player estilo Songsterr) + tabs propias
- [ ] Entrenamiento SRS de notas del mástil (SM-2 simplificado)
- [ ] Storybook

## Fase 2.5 — El curso deja de ser una fila (cuando haya 2-3 especialidades)

Con los módulos D-M (blues, jazz, rock, fingerstyle, funk, fusión, flamenco,
improvisación…) el curso pasa de lista lineal a **grafo de itinerarios**:
`track` y `prerequisites` en los módulos, itinerario activo en el perfil,
`/hoy` eligiendo dentro de ese camino y repaso espaciado de lecciones antiguas.
Ver "Currículo a largo plazo" en `content/BACKLOG.md`.

## Fase 3 — Progreso profundo

Grabaciones + comparador · gráficas y heatmap · Mi espacio completo ·
evaluaciones de módulo · gamificación sobria.

## Fase 4 — Extras

PWA offline · afinador · drone · export/import.

## Aparcado (ver content/BACKLOG.md)

Multi-alumno, editor web de contenido, IA embebida, app nativa.
