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
- `<Fretboard frets tuning highlights labels lefty interactive onFretClick />`
  (Fase 2) — SVG accesible; lógica de posiciones pura en `src/lib/music`.
- `<ChordDiagram />` — svguitar. `<Tab />` — AlphaTab (cargar en cliente,
  pesa; lazy import).

## Primitivas de autoría en MDX

El contenido **no dibuja nada a mano**: nunca una lista tipo "6ª cuerda: 5-8"
donde cabe un diagrama. Componentes disponibles desde cualquier `.mdx`:

```mdx
<Mastil escala="A minor-pentatonic" desde="5" hasta="8" pie="Caja 1" />
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
