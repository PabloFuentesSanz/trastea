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

## Canciones (`/songs`)

El catálogo es la fuente de repertorio del curso: una lección pide canciones por
técnica y nivel, no por título. Por eso los tres ejes de clasificación son
vocabulario cerrado en `src/lib/content/song-taxonomy.ts` y `content:audit`
falla si una ficha inventa un valor.

```yaml
slug: wonderwall
title: "Wonderwall"
artist: "Oasis"
level: 2 # 1 primeros acordes … 5 reto
purpose: "..." # POR QUÉ está en el catálogo (se ve en la tarjeta)
key: "Em" # centro tonal del arreglo de guitarra habitual
style: rock # enum
techniques: [rasgueo, capo] # enum, mínimo 1: qué se practica tocándola
collections: [fogata] # enum, mínimo 1: temáticas curadas
chords: ["Em7", "G", "Dsus4"] # cifrado; alimenta "¿qué puedo tocar ya?"
progression: "i-III-VII-IV" # opcional
year: 1995 # opcional
bpm: 87 # opcional; genera el enlace a /metronomo?bpm=
capo: 2 # opcional
tuning: "Drop D" # opcional; ausente = estándar
```

Reglas del catálogo:

- **`chords` solo si estás seguro.** El filtro "acordes que ya sé" promete que
  la canción se puede tocar entera con ellos; una ficha sin `chords` queda fuera
  de ese filtro, que es el comportamiento correcto. Mejor vacío que inventado.
- **Nada de letras ni tablaturas con copyright.** La ficha es metadatos y
  criterio pedagógico propio. Para la tab, `external_tab_url` a la fuente.
- `youtube_url` y `external_tab_url` apuntan a **búsquedas**, no a IDs
  concretos: un vídeo caído deja un enlace roto, una búsqueda no.
- Tab propia (`tab_slug` → `/content/tabs`) solo con material propio o de
  dominio público — para eso está la colección `clasica-dominio-publico`.
- Una colección o una técnica sin canciones sale como aviso en `STATE.md`: es un
  hueco del catálogo, porque el curso no puede pedir lo que no existe.
