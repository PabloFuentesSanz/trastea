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

## Errores típicos a evitar

- Mezclar sostenidos y bemoles en una misma escala.
- Olvidar `AudioContext.resume()` tras gesto del usuario (iOS/Safari).
- Recalcular posiciones en cada render: memoiza por (root, scale, tuning).
- Poner estado de herramienta en Zustand en vez de la URL: los deep links de
  las lecciones dependen de los query params.
