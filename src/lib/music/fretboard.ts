/**
 * Cálculo puro de posiciones en el mástil a partir de fórmulas de intervalos.
 * Separado del render de <Fretboard /> y testeado.
 */

import {
  mod12,
  parseInterval,
  parseNote,
  spellFormula,
  type IntervalName,
  type NoteName,
  type PitchClass,
} from "./notes";

export interface FretPosition {
  /** índice de cuerda: 0 = 6ª (grave) … 5 = 1ª (aguda) */
  string: number;
  fret: number;
  midi: number;
  pc: PitchClass;
  /** índice del intervalo dentro de la fórmula (0 = raíz) */
  degreeIndex: number;
  /** nombre deletreado correctamente para la tonalidad */
  note: NoteName;
  /** nombre del intervalo ("1", "b3"…) */
  interval: IntervalName;
  isRoot: boolean;
}

export function midiAt(
  tuningMidi: readonly number[],
  string: number,
  fret: number,
): number {
  const open = tuningMidi[string];
  if (open === undefined) throw new Error(`Cuerda fuera de rango: ${string}`);
  if (fret < 0) throw new Error(`Traste inválido: ${fret}`);
  return open + fret;
}

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Todas las posiciones de una fórmula (escala o acorde) en el mástil. */
export function formulaPositions(options: {
  root: NoteName;
  intervals: readonly IntervalName[];
  tuningMidi: readonly number[];
  frets: number;
}): FretPosition[] {
  const { root, intervals, tuningMidi, frets } = options;
  const rootPc = parseNote(root).pc;
  const names = spellFormula(root, intervals);

  const byPc = new Map<
    PitchClass,
    { degreeIndex: number; note: NoteName; interval: IntervalName }
  >();
  intervals.forEach((interval, i) => {
    const pc = mod12(rootPc + parseInterval(interval).semitones);
    if (!byPc.has(pc)) byPc.set(pc, { degreeIndex: i, note: names[i], interval });
  });

  const positions: FretPosition[] = [];
  for (let string = 0; string < tuningMidi.length; string++) {
    for (let fret = 0; fret <= frets; fret++) {
      const midi = midiAt(tuningMidi, string, fret);
      const pc = mod12(midi);
      const hit = byPc.get(pc);
      if (hit) {
        positions.push({
          string,
          fret,
          midi,
          pc,
          degreeIndex: hit.degreeIndex,
          note: hit.note,
          interval: hit.interval,
          isRoot: pc === rootPc,
        });
      }
    }
  }
  return positions;
}

/** Notas de la fórmula en orden ascendente desde la raíz (para reproducirla). */
export function formulaMidiSequence(options: {
  root: NoteName;
  intervals: readonly IntervalName[];
  /** octava MIDI base para la raíz (por defecto raíz ≥ E3=52) */
  baseMidi?: number;
}): number[] {
  const { root, intervals } = options;
  const rootPc = parseNote(root).pc;
  const base = options.baseMidi ?? 52 + mod12(rootPc - 4);
  const sequence = intervals.map((iv) => base + parseInterval(iv).semitones);
  return [...sequence, base + 12];
}
