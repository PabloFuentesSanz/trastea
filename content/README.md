# /content — cómo funciona

Contenido educativo versionado en git. Añadir contenido = añadir ficheros.
`pnpm content:audit` valida frontmatter y referencias (slug roto = build rojo)
y regenera `STATE.md`.

```
/course/<modulo>/module.mdx        módulo (slug, order, goals, assessment)
/course/<modulo>/wNN/week.mdx      semana (slug <modulo>-wNN, focus, summary)
/course/<modulo>/wNN/dN.mdx        lección-día (ver .claude/skills/add-lesson)
/exercises/<slug>.mdx              ejercicio reutilizable
/songs/<slug>.mdx                  ficha de canción
/tabs/<slug>.alphatex              tablaturas propias (AlphaTab)
/wiki/<slug>.mdx                   artículo (ver .claude/skills/add-wiki)
/quizzes/<slug>.mdx                evaluación de módulo (preguntas en frontmatter)
/seed/                             fuente del curso (plan 12 semanas)
```

Reglas:

- Slugs en kebab-case, únicos por tipo. Lecciones: `<modulo>-wNN-dN`.
- Los schemas viven en `src/lib/content/schemas.ts` (zod). Si necesitas un
  campo nuevo, se añade allí primero.
- Tono de los textos: cercano, directo, algo juguetón; ejemplos siempre en el
  mástil. Nada de paja motivacional.
- Tabs alphaTex solo de material propio o dominio público. Canciones con
  copyright: `external_tab_url` hacia la fuente.
- Los `[[interlinks]]` solo en la wiki; generan backlinks automáticamente.
- Deep links a herramientas con estado precargado: `/metronomo?bpm=70`,
  `/escalas?root=F&type=minor-pentatonic`.
