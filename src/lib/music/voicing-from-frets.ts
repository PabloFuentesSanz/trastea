/**
 * Construye un Voicing a partir de una digitación escrita a mano
 * ("3,x,3,4,x,x", de 6ª a 1ª).
 *
 * El generador solo enumera grupos de cuerdas contiguas, así que no puede
 * expresar formas que saltan una cuerda —un shell voicing es 6ª-4ª-3ª— ni
 * digitaciones concretas de una canción. Para eso está esto.
 */

import { midiAt } from "./fretboard";
import {
  mod12,
  parseInterval,
  parseNote,
  type IntervalName,
  type NoteName,
} from "./notes";
import type { Voicing } from "./voicings";

/** "3,x,3,4,x,x" → [3, null, 3, 4, null, null] (índice 0 = 6ª cuerda) */
export function parseFretSpec(spec: string): (number | null)[] {
  const parts = spec
    .split(/[,\s]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length !== 6) {
    throw new Error(
      `Una digitación son 6 valores de 6ª a 1ª, no ${parts.length}: "${spec}"`,
    );
  }

  return parts.map((part) => {
    if (/^[xX-]$/.test(part)) return null;
    const fret = Number(part);
    if (!Number.isInteger(fret) || fret < 0 || fret > 24) {
      throw new Error(`Traste inválido en la digitación: "${part}" (en "${spec}")`);
    }
    return fret;
  });
}

export function voicingFromFrets(options: {
  root: NoteName;
  intervals: readonly IntervalName[];
  frets: (number | null)[];
  tuningMidi: readonly number[];
}): Voicing {
  const { root, intervals, frets, tuningMidi } = options;
  const rootPc = parseNote(root).pc;

  const intervalByPc = new Map<number, IntervalName>();
  for (const interval of intervals) {
    intervalByPc.set(mod12(rootPc + parseInterval(interval).semitones), interval);
  }

  const midis: number[] = [];
  const voicedIntervals: (IntervalName | null)[] = frets.map((fret, string) => {
    if (fret === null) return null;
    const midi = midiAt(tuningMidi, string, fret);
    midis.push(midi);
    return intervalByPc.get(mod12(midi)) ?? null;
  });

  const fretted = frets.filter((f): f is number => f !== null && f > 0);
  const baseFret = fretted.length > 0 ? Math.min(...fretted) : 0;

  // el bajo sonante decide la inversión
  const bass = voicedIntervals.find((interval) => interval !== null) ?? null;
  const inversion = bass ? Math.max(0, intervals.indexOf(bass)) : 0;

  const atBase = fretted.filter((f) => f === baseFret).length;

  return {
    frets,
    baseFret,
    midis,
    intervals: voicedIntervals,
    inversion,
    usesOpenStrings: frets.some((f) => f === 0),
    isBarre: atBase >= 3,
    soundingStrings: frets.filter((f) => f !== null).length,
  };
}
