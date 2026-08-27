---
name: music-ui
description: APIs de los componentes musicales (Fretboard, ChordDiagram, Tab, Metronome), teoría mínima y errores típicos (enarmonías, afinaciones). Consultar antes de tocar UI musical.
---

# Music UI

## Teoría mínima operativa

- Pitch class 0-11 (C=0). MIDI: E2 grave de la guitarra = 40.
- **Nunca** conviertas pc→nombre con una tabla fija: usa
  `spellFormula(root, intervals)` / `transpose` de `src/lib/music/notes.ts`,
  que deletrea por grados (en Fa mayor sale Sib, no La#).
- Fórmulas de escalas/acordes en `src/data/{scales,chords}.ts` como intervalos
  (`"1" "b3" "#4"`). Añadir escala = añadir entrada, jamás posiciones a mano.
- Afinaciones en `src/data/tunings.ts` como MIDI por cuerda, de 6ª a 1ª.
  Cuerda "6" = índice 0 del array. Cuidado: en la UI la 1ª (aguda) se dibuja
  arriba o abajo según convención de tabs — documenta la elección en el
  componente y sé consistente.

## Componentes

- `<Metronome bpm sig sub accents autoIncrement embedded />` — el motor agenda
  con lookahead sobre el reloj de audio (ver `src/lib/metronome/`). La UI lee
  el tiempo agendado; nunca `setInterval` para el sonido.
- `<Fretboard positions frets fromFret labels lefty title />` — SVG accesible;
  lógica de posiciones pura en `src/lib/music`. `fromFret` recorta una ventana
  numerando los trastes reales.
- `<FormulaExplorer kind basePath ... initialView initialNotesPerString />` —
  el de `/escalas` tiene tres vistas (`view=mastil|cajas|cuerdas`) y, en
  escalas de siete notas, `npc=2|3`. Todo en la URL.
- `<ChordDiagram />` — svguitar. `<Tab />` — AlphaTab (cargar en cliente,
  pesa; lazy import).

## Primitivas de autoría en MDX

El contenido **no dibuja nada a mano**: nunca una lista tipo "6ª cuerda: 5-8"
donde cabe un diagrama. Componentes disponibles desde cualquier `.mdx`:

```mdx
<Mastil escala="A minor-pentatonic" caja="1" />
<Cajas escala="A minor-pentatonic" /> {/* TODAS las posiciones */}
<PorCuerdas escala="A minor-pentatonic" /> {/* la escala cuerda a cuerda */}
<Mastil escala="A minor-pentatonic" desde="5" hasta="8" pie="una zona cualquiera" />
<Mastil acorde="Am7" desde="5" hasta="8" cuerdas="4, 3, 2" />
<Acordes>
  <Acorde nombre="C" />
  <Acorde nombre="Am7" zona="5" />
</Acordes>
<Ficha formula="1 - b3 - 4 - 5 - b7" notas="En La: A C D E G" suena="…" usa="…" />
<Aviso tipo="error">Lo que todo el mundo hace mal.</Aviso>
<Rutina>
  <Paso dias="1-3" min="10" bpm="60" tool="/metronomo?bpm=60">
    …
  </Paso>
</Rutina>
<Canciones titulo="Dónde practicarla">
  <Cancion
    titulo="Back in Black"
    artista="AC/DC"
    nivel="2"
    desde="2:10"
    que="qué se practica exactamente"
    como="cómo se practica"
  />
</Canciones>
```

`escala`/`acorde` se resuelven contra `SCALES`/`CHORDS` (`parseFormulaSpec`):
un id inexistente revienta el build, no dibuja algo equivocado.

### ⚠️ Una caja NO es una ventana de trastes

Para una posición de escala se usa **siempre `caja="N"`**, nunca `desde/hasta`.
Una caja es un patrón de digitación con un par de trastes distinto en cada
cuerda: recortarla por rectángulo se come notas de la caja vecina y pierde las
propias (la caja 2 de la pentatónica baja al traste 7 aunque "empiece" en el
8). El patrón se deduce de la fórmula en `src/lib/music/boxes.ts`, no se
escribe a mano. `content:audit` rechaza `desde/hasta` en cualquier `<Mastil>`
cuyo pie hable de una caja.

Las escalas que heredan digitación (el blues es la pentatónica con la b5
metida dentro) lo declaran con `boxParent` en `src/data/scales.ts`.

### Regla de contenido: todas las formas, siempre

Donde se hable de una escala salen **todas** sus cajas (`<Cajas>`), no una de
muestra, y el estudio **cuerda a cuerda** (`<PorCuerdas>`).

Y no es una promesa: la ficha declara de qué escala trata en el frontmatter
(`scale: "A minor-pentatonic"`) y `content:audit` **exige** que el cuerpo
tenga `<Cajas escala="…">` y `<PorCuerdas escala="…">` con esa misma escala.
Sin el campo no hay obligación —un artículo puede dibujar una escala como
apoyo sin tratar de ella—, pero si lo pones, o está completo o es build rojo.

### ⚠️ Las expresiones MDX no se evalúan

En este pipeline `desde={5}` **llega como `undefined`** y `{1 + 1}` en el
cuerpo renderiza vacío. Se escriben **siempre entre comillas**: `desde="5"`,
`min="10"`, `cuerdas="6, 5, 4"`. Los componentes convierten con `num()`/`nums()`.
`pnpm content:audit` rechaza cualquier `prop={…}` con fichero y línea, así que
el fallo es rojo y no silencioso.

## Errores típicos a evitar

- Mezclar sostenidos y bemoles en una misma escala.
- Olvidar `AudioContext.resume()` tras gesto del usuario (iOS/Safari).
- Recalcular posiciones en cada render: memoiza por (root, scale, tuning).
- Poner estado de herramienta en Zustand en vez de la URL: los deep links de
  las lecciones dependen de los query params.
- Escribir notas, cajas o digitaciones como texto en el contenido: eso es
  siempre un `<Mastil>` o un `<Acorde>`.
- Citar canciones sin decir qué parte se practica y cómo: `<Cancion>` obliga
  a rellenar `que`, y `como` va en casi todas.
