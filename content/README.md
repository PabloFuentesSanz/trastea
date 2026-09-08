# /content — cómo funciona

Contenido educativo versionado en git. Añadir contenido = añadir ficheros.
`pnpm content:audit` valida frontmatter y referencias (slug roto = build rojo)
y regenera `STATE.md`.

```
/course/<modulo>/module.mdx        módulo (slug, order, goals, assessment)
/course/<modulo>/wNN/week.mdx      semana (slug <modulo>-wNN, focus, summary)
/course/<modulo>/wNN/dN.mdx        lección-día (ver .claude/skills/add-lesson)
/course/estilos/<estilo>/week.mdx  semana de estilo: `estilo` + `after` (la semana
                                   del tronco detrás de la que se intercala)
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

## El orden del curso

El tronco es Desde cero → A → B → C, módulo a módulo y semana a semana. Las
semanas de estilo (`/course/estilos/*`) no van al final: cada `week.mdx`
declara `estilo` (blues, rock, folk, jazz, metal) y `after` (el slug de la
semana del tronco detrás de la que se estudia), y `src/lib/content/sequence.ts`
las cuela en su sitio sin renumerar nada. Su techo de canciones y el nivel de
sus ejercicios son los de la semana ancla.

## La lección-día

Cada día dice **para qué sirve** (`para_que`, una frase que nombra la canción
o el pasaje donde se usa), tiene un `goal` medible, termina en una canción de
verdad (al menos un bloque con `song`, con `notes` que digan qué parte y
cómo), dibuja algo (`<Mastil>`, `<Tab>`, `<Acorde>`, `<Rejilla>`,
`<Rasgueo>`) y no pasa de 250 palabras de prosa: lo largo va a la wiki. En el
bloque de la lección se enseñan solo las dos líneas de la primera `<Ficha>`
del ejercicio (`queEs`, `paraQue`); la ficha entera queda plegada.

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
- **Cada ficha explica cómo se toca**, con estas secciones y en este orden:
  `## Qué aprendes`, `## Cómo se toca`, `## Por dónde empezar` (tres pasos con
  bpm) y `## En qué fijarte`. Mínimo 80 palabras. Sin letras ni tabs: los
  acordes son los de `chords`, y si no hay `chords` se remite a la tab externa.
