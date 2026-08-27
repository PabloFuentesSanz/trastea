/**
 * Cajas (posiciones) de una escala en el mástil.
 *
 * Una caja **no es una ventana rectangular de trastes**: es un patrón de
 * digitación con un par de trastes distinto en cada cuerda. Recortar por
 * rectángulo se come notas de la caja vecina y pierde las propias — se ve
 * claro en la caja 2 de la pentatónica, que baja al traste 7 en tres cuerdas
 * aunque "empiece" en el 8.
 *
 * El patrón se deduce, no se escribe a mano: se reparten las notas de la
 * escala por cuerdas, n por cuerda, siempre subiendo de altura. De ahí salen
 * las cinco cajas canónicas de la pentatónica sin una sola posición fija en
 * el código (ver boxes.test.ts).
 */

import { midiAt, type FretPosition } from "./fretboard";
import {
  mod12,
  parseInterval,
  parseNote,
  spellFormula,
  type IntervalName,
  type NoteName,
  type PitchClass,
} from "./notes";

export interface ScaleBoxOptions {
  root: NoteName;
  intervals: readonly IntervalName[];
  tuningMidi: readonly number[];
  /** 1 = la caja que empieza en la raíz; hay tantas como notas la escala */
  box: number;
  /** 2 para pentatónicas, 3 para escalas de siete notas (por defecto) */
  notesPerString?: number;
  /**
   * Fórmula de la escala de la que hereda la digitación. Cuando se da, la
   * caja se construye con ella y luego se meten dentro las notas extra de
   * esta escala: es lo que hace que la caja de blues sea la de la
   * pentatónica con la b5 colada, y no un reparto uniforme sin sentido.
   */
  parentIntervals?: readonly IntervalName[];
  /**
   * Traste desde el que se busca la caja. Por defecto, el de la raíz en la
   * cuerda más grave: así las cajas 1..n suben por el mástil en orden en vez
   * de caer cada una en la octava que pille.
   */
  startFret?: number;
}

/**
 * Cuántas cajas tiene una escala: una por nota — o las de su escala madre,
 * si hereda la digitación (el blues tiene cinco cajas, no seis).
 */
export function boxCount(
  intervals: readonly IntervalName[],
  parentIntervals?: readonly IntervalName[],
): number {
  return (parentIntervals ?? intervals).length;
}

function defaultNotesPerString(intervals: readonly IntervalName[]): number {
  return intervals.length <= 5 ? 2 : 3;
}

/**
 * Último traste que se puede tocar. Las guitarras tienen entre 20 y 24; 22 es
 * el techo razonable, y por encima de ahí la caja deja de existir.
 */
export const MAX_PLAYABLE_FRET = 22;

/**
 * Baja la caja octavas enteras hasta que quepa en el mástil.
 *
 * Las cajas se numeran subiendo desde la raíz en la 6ª cuerda, así que en
 * tonalidades altas las últimas se salen: la caja 7 de Do mayor caía en los
 * trastes 19-24 y se dibujaba tan tranquila. El traste 24 no existe en la
 * mayoría de guitarras y en ninguna acústica. Bajar doce trastes es la misma
 * forma exacta, sonando una octava más grave — que es donde se toca de verdad.
 */
function intoNeck(positions: FretPosition[]): FretPosition[] {
  if (positions.length === 0) return positions;
  let salida = positions;
  for (let vuelta = 0; vuelta < 3; vuelta += 1) {
    const max = Math.max(...salida.map((p) => p.fret));
    const min = Math.min(...salida.map((p) => p.fret));
    if (max <= MAX_PLAYABLE_FRET || min < 12) return salida;
    salida = salida.map((p) => ({ ...p, fret: p.fret - 12, midi: p.midi - 12 }));
  }
  return salida;
}

export function scaleBox(options: ScaleBoxOptions): FretPosition[] {
  const { root, tuningMidi, box, parentIntervals } = options;

  // Con escala madre: se dibuja su caja y se rellenan los huecos con las
  // notas propias que caen dentro del alcance de la mano.
  if (parentIntervals) {
    const base = scaleBox({
      ...options,
      intervals: parentIntervals,
      parentIntervals: undefined,
    });
    return withExtraNotes(base, options);
  }

  const { intervals } = options;
  const total = boxCount(intervals);

  if (!Number.isInteger(box) || box < 1 || box > total) {
    throw new Error(`No existe la caja ${box}: esta escala tiene ${total} cajas`);
  }

  const perString = options.notesPerString ?? defaultNotesPerString(intervals);
  const names = spellFormula(root, intervals);
  const rootPc = parseNote(root).pc;

  /** Datos de cada grado, en orden ascendente desde la raíz. */
  const degrees = intervals.map((interval, i) => ({
    pc: mod12(rootPc + parseInterval(interval).semitones) as PitchClass,
    interval,
    note: names[i],
    degreeIndex: i,
  }));

  const positions: FretPosition[] = [];

  // Ancla de la serie: la raíz en la cuerda más grave. Sin esto, la caja 5
  // de La menor saldría en el traste 2 (misma forma, otra octava) en vez de
  // en el 15, y las cajas no subirían en orden.
  const startFret =
    options.startFret ??
    findFret(tuningMidi, 0, rootPc, { minFret: 0, aboveMidi: -1 }) ??
    0;

  // La caja arranca en el grado `box - 1`, en la cuerda más grave.
  let degree = box - 1;
  let previousMidi = -1;

  for (let string = 0; string < tuningMidi.length; string++) {
    for (let n = 0; n < perString; n++) {
      const target = degrees[degree % total];
      const fret = findFret(tuningMidi, string, target.pc, {
        minFret: previousMidi < 0 ? startFret : 0,
        aboveMidi: previousMidi,
      });
      if (fret === null) break;

      const midi = midiAt(tuningMidi, string, fret);
      positions.push({
        string,
        fret,
        midi,
        pc: mod12(midi),
        degreeIndex: target.degreeIndex,
        note: target.note,
        interval: target.interval,
        isRoot: mod12(midi) === rootPc,
      });

      previousMidi = midi;
      degree += 1;
    }
  }

  return intoNeck(positions);
}

/** Traste más grave de esa cuerda que suena `pc` y queda por encima de `aboveMidi`. */
function findFret(
  tuningMidi: readonly number[],
  string: number,
  pc: PitchClass,
  { minFret, aboveMidi }: { minFret: number; aboveMidi: number },
): number | null {
  for (let fret = minFret; fret <= 24; fret++) {
    const midi = midiAt(tuningMidi, string, fret);
    if (mod12(midi) !== pc) continue;
    if (midi <= aboveMidi) continue;
    return fret;
  }
  return null;
}

/**
 * Mete las notas propias de la escala que caigan dentro de la caja de la
 * escala madre. "Dentro" = entre el traste más grave y el más agudo de esa
 * cuerda, con un traste de margen arriba (donde cae la b5 del blues en la
 * 4ª cuerda).
 */
function withExtraNotes(base: FretPosition[], options: ScaleBoxOptions): FretPosition[] {
  const { root, intervals, tuningMidi } = options;
  const rootPc = parseNote(root).pc;
  const names = spellFormula(root, intervals);

  const yaEstan = new Set(base.map((p) => `${p.string}:${p.fret}`));
  const extra: FretPosition[] = [];

  for (let string = 0; string < tuningMidi.length; string++) {
    const enCuerda = base.filter((p) => p.string === string);
    if (enCuerda.length === 0) continue;
    const min = Math.min(...enCuerda.map((p) => p.fret));
    // un traste de margen arriba (ahí cae la b5 del blues en la 4ª cuerda),
    // pero nunca más allá del mástil: una nota en el traste 23 no se toca
    const max = Math.min(Math.max(...enCuerda.map((p) => p.fret)) + 1, MAX_PLAYABLE_FRET);

    for (let fret = min; fret <= max; fret++) {
      if (yaEstan.has(`${string}:${fret}`)) continue;
      const midi = midiAt(tuningMidi, string, fret);
      const pc = mod12(midi);
      const degree = intervals.findIndex(
        (interval) => mod12(rootPc + parseInterval(interval).semitones) === pc,
      );
      if (degree === -1) continue;
      extra.push({
        string,
        fret,
        midi,
        pc,
        degreeIndex: degree,
        note: names[degree],
        interval: intervals[degree],
        isRoot: pc === rootPc,
      });
    }
  }

  return [...base, ...extra].sort((a, b) => a.midi - b.midi);
}

/**
 * Ventana de mástil que enmarca unas posiciones, con un traste de aire a
 * cada lado. La usan tanto <Mastil caja> como el explorador de /escalas.
 */
export function boxWindow(positions: readonly FretPosition[]): {
  fromFret: number;
  toFret: number;
} {
  if (positions.length === 0) return { fromFret: 0, toFret: 15 };
  const frets = positions.map((p) => p.fret);
  return {
    fromFret: Math.max(Math.min(...frets) - 1, 0),
    toFret: Math.max(...frets) + 1,
  };
}
