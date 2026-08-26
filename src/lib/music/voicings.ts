/**
 * Generador de digitaciones (voicings) de un acorde por todo el diapasón.
 * Puro y testeado: enumera formas tocables (estilo CAGED, abiertos, cejilla,
 * tríadas por grupos de cuerdas) a partir de la fórmula de intervalos.
 */

import {
  mod12,
  parseInterval,
  parseNote,
  type IntervalName,
  type NoteName,
  type PitchClass,
} from "./notes";

export interface Voicing {
  /** traste por cuerda, índice 0 = 6ª (grave) … 5 = 1ª; null = muteada */
  frets: (number | null)[];
  /** traste pisado más grave (0 si todo al aire) — para rotular "5º" */
  baseFret: number;
  /** notas MIDI sonantes, de grave a agudo */
  midis: number[];
  /** intervalo de la fórmula que suena en cada cuerda (null = muteada) */
  intervals: (IntervalName | null)[];
  /** 0 = fundamental en el bajo, 1 = 1ª inversión, … */
  inversion: number;
  usesOpenStrings: boolean;
  isBarre: boolean;
  soundingStrings: number;
}

export interface GenerateVoicingsOptions {
  root: NoteName;
  intervals: readonly IntervalName[];
  tuningMidi: readonly number[];
  /** nº de cuerdas sonantes exacto mínimo/máximo (tríadas: 3/3) */
  minStrings?: number;
  maxStrings?: number;
  /** ventana máxima de trastes pisados */
  maxSpan?: number;
  /** traste máximo de inicio de ventana */
  maxBaseFret?: number;
  /** limitar a un grupo de cuerdas contiguas [desde, hasta] (índices 0-5) */
  stringSet?: [number, number];
}

interface Candidate {
  fret: number | null;
  pc: PitchClass | null;
  interval: IntervalName | null;
}

/** ¿Es tocable con una mano normal? (heurística) */
function isPlayable(frets: (number | null)[]): { ok: boolean; isBarre: boolean } {
  const fretted = frets.filter((f): f is number => f !== null && f > 0);
  if (fretted.length === 0) return { ok: true, isBarre: false };

  const min = Math.min(...fretted);
  const max = Math.max(...fretted);
  if (max - min > 3) return { ok: false, isBarre: false };

  const atMin = fretted.filter((f) => f === min).length;
  const aboveMin = fretted.length - atMin;
  const hasOpen = frets.some((f) => f === 0);

  // Sin cejilla: hasta 4 dedos
  if (fretted.length <= 4) {
    const isBarre = atMin >= 3 && !hasOpen && fretted.length >= 4;
    return { ok: true, isBarre };
  }
  // Con cejilla: el índice cubre el traste mínimo; nada al aire y ≤3 dedos más
  if (!hasOpen && atMin >= 2 && aboveMin <= 3) return { ok: true, isBarre: true };
  return { ok: false, isBarre: false };
}

export function generateVoicings(options: GenerateVoicingsOptions): Voicing[] {
  const {
    root,
    intervals,
    tuningMidi,
    minStrings = 4,
    maxStrings = tuningMidi.length,
    maxSpan = 3,
    maxBaseFret = 12,
    stringSet,
  } = options;

  const rootPc = parseNote(root).pc;
  const pcToInterval = new Map<PitchClass, IntervalName>();
  for (const interval of intervals) {
    const pc = mod12(rootPc + parseInterval(interval).semitones);
    if (!pcToInterval.has(pc)) pcToInterval.set(pc, interval);
  }
  const chordPcs = new Set(pcToInterval.keys());
  // En acordes de 4+ notas se permite omitir la 5ª justa
  const fifthPc =
    intervals.includes("5") && intervals.length >= 4 ? mod12(rootPc + 7) : null;

  const stringCount = tuningMidi.length;
  const firstString = stringSet ? stringSet[0] : 0;
  const lastString = stringSet ? stringSet[1] : stringCount - 1;

  const seen = new Set<string>();
  const voicings: Voicing[] = [];

  for (let windowStart = 0; windowStart <= maxBaseFret; windowStart++) {
    // Candidatos por cuerda dentro de la ventana [windowStart, windowStart+maxSpan]
    const candidates: Candidate[][] = [];
    for (let s = 0; s < stringCount; s++) {
      const list: Candidate[] = [{ fret: null, pc: null, interval: null }];
      if (s >= firstString && s <= lastString) {
        const openPc = mod12(tuningMidi[s]);
        if (chordPcs.has(openPc)) {
          list.push({ fret: 0, pc: openPc, interval: pcToInterval.get(openPc)! });
        }
        for (let f = Math.max(1, windowStart); f <= windowStart + maxSpan; f++) {
          const pc = mod12(tuningMidi[s] + f);
          if (chordPcs.has(pc)) {
            list.push({ fret: f, pc, interval: pcToInterval.get(pc)! });
          }
        }
      }
      candidates.push(list);
    }

    // Enumeración con poda simple
    const stack: Candidate[] = [];
    const enumerate = (s: number) => {
      if (s === stringCount) {
        evaluate(stack);
        return;
      }
      for (const c of candidates[s]) {
        stack.push(c);
        enumerate(s + 1);
        stack.pop();
      }
    };

    const evaluate = (combo: Candidate[]) => {
      const soundingIdx = combo
        .map((c, i) => (c.fret !== null ? i : -1))
        .filter((i) => i >= 0);
      const count = soundingIdx.length;
      if (count < Math.max(3, minStrings) || count > maxStrings) return;
      // cuerdas sonantes contiguas
      if (soundingIdx[soundingIdx.length - 1] - soundingIdx[0] !== count - 1) return;

      const frets = combo.map((c) => c.fret);
      const key = frets.join(",");
      if (seen.has(key)) return;

      // cobertura: todas las notas del acorde (la 5ª es omitible en 4+ notas)
      const soundedPcs = new Set(
        combo.filter((c) => c.pc !== null).map((c) => c.pc as number),
      );
      for (const pc of chordPcs) {
        if (!soundedPcs.has(pc) && pc !== fifthPc) return;
      }

      const playable = isPlayable(frets);
      if (!playable.ok) return;

      seen.add(key);

      const midis = soundingIdx.map((i) => tuningMidi[i] + (frets[i] as number));
      const bassPc = mod12(midis[0]);
      const bassInterval = pcToInterval.get(bassPc)!;
      const inversion = intervals.indexOf(bassInterval);
      const fretted = frets.filter((f): f is number => f !== null && f > 0);

      voicings.push({
        frets,
        baseFret: fretted.length ? Math.min(...fretted) : 0,
        midis,
        intervals: combo.map((c) => c.interval),
        inversion: inversion < 0 ? 0 : inversion,
        usesOpenStrings: frets.some((f) => f === 0),
        isBarre: playable.isBarre,
        soundingStrings: count,
      });
    };

    enumerate(0);
  }

  // Por zona del mástil (CAGED); dentro de cada zona, primero la forma
  // fundamental con más cuerdas (la "clásica"), luego las inversiones.
  voicings.sort(
    (a, b) =>
      a.baseFret - b.baseFret ||
      a.inversion - b.inversion ||
      b.soundingStrings - a.soundingStrings,
  );
  return voicings;
}

/** Tríadas (3 cuerdas contiguas) del acorde, opcionalmente en un grupo concreto. */
export function generateTriadVoicings(
  options: Omit<GenerateVoicingsOptions, "minStrings" | "maxStrings">,
): Voicing[] {
  return generateVoicings({ ...options, minStrings: 3, maxStrings: 3 });
}
