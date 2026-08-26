---
name: add-lesson
description: Crear una lección-día del curso con la estructura pedagógica y el frontmatter correctos. Usar al añadir o regenerar lecciones en /content/course.
---

# Añadir una lección-día

Ruta: `/content/course/<modulo>/w<NN>/d<N>.mdx`. La lección-día es la unidad
central del curso: 30-45 min de práctica guiada.

## Frontmatter (validado por zod en `src/lib/content/schemas.ts`)

```yaml
slug: a-cimientos-w01-d1 # <modulo>-w<NN>-d<N>, único global
title: "El diapasón existe — día 1"
order: 1 # día dentro de la semana (1-5)
duration_min: 40
goal: "Nombrar cualquier nota de la 6ª cuerda en <2s" # SIEMPRE medible
blocks:
  - { id: b1, type: tecnica, min: 8, exercise: cromatico-1234, bpm_start: 60 }
  - {
      id: b2,
      type: diapason,
      min: 10,
      exercise: notas-6a-cuerda,
      tool: "/escalas?root=E&type=chromatic",
    }
  - {
      id: b3,
      type: oido,
      min: 7,
      exercise: metronomo-2y4,
      tool: "/metronomo?bpm=60&sub=1",
    }
  - {
      id: b4,
      type: aplicacion,
      min: 10,
      exercise: blues-f-pentatonica,
      song: blues-en-fa,
    }
  - { id: b5, type: repertorio, min: 5, song: autumn-leaves }
wiki_refs: [notas-musicales, cifrado-americano]
```

Tipos de bloque: `tecnica | diapason | oido | aplicacion | repertorio | teoria`.
Cada bloque referencia `exercise` y/o `song` por slug (deben existir) y puede
llevar `tool` (ruta interna con query params precargados) y `bpm_start`.

## Estructura pedagógica

- **d1** introduce el material de la semana con más explicación (cuerpo MDX
  más largo, enlaces a wiki). **d2-d4** varían ejercicios y suben bpm objetivo.
  **d5** es repaso + mini-reto medible.
- El objetivo (`goal`) siempre es verificable: "X a Y bpm limpio", "<2s", "sin
  mirar el mástil". Nunca "mejorar en…".
- Cuerpo MDX: breve (el player ya renderiza los bloques). Explica el _porqué_
  del día, 2-4 párrafos máximo, tono directo y cercano, ejemplos en el mástil.
  Puede embeber `<WikiLink>`, `<ToolLink>`, `<YouTube>`.

## Checklist antes de dar por buena

- [ ] Suma de `min` de los bloques ≈ `duration_min` (±5).
- [ ] Todos los slugs referenciados existen (`pnpm content:audit` verde).
- [ ] `goal` medible; bpm de partida coherente con d1-d5 de la semana.
- [ ] `wiki_refs` cubren la teoría que usa el día.
