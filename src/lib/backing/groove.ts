/**
 * Base de acompañamiento a partir de una rejilla de acordes.
 *
 * Lógica pura: convierte "F7 | Bb7 | F7 …" en una lista de notas con su
 * posición en pulsos. No sabe nada de audio — quién las hace sonar es
 * backing/engine.ts, igual que pattern.ts y engine.ts en el metrónomo.
 *
 * El objetivo no es sonar a disco: es que puedas tocar encima. Bajo que
 * marca la fundamental y un acompañamiento con el groove del estilo, con
 * las voces conducidas para que la armonía no salte de octava cada compás.
 */

import { getTuning } from "@/data/tunings";
import type { GridBar } from "@/lib/music/grid";
import { mod12, parseNote, type NoteName } from "@/lib/music/notes";
import { parseFormulaSpec } from "@/lib/music/spec";
import { generateVoicings } from "@/lib/music/voicings";

const STANDARD = getTuning("standard").midi;

/** Registro del bajo: de Mi grave (40) a Mi de la 4ª cuerda (52). */
const BASS_LOW = 40;
const BASS_HIGH = 52;
/** Altura a la que se centra el acompañamiento cuando no hay acorde previo. */
const COMP_CENTER = 62;

export const BACKING_STYLES = ["recto", "swing", "shuffle", "bossa", "funk"] as const;
export type BackingStyle = (typeof BACKING_STYLES)[number];

export const STYLE_LABELS: Record<BackingStyle, string> = {
  recto: "Recto",
  swing: "Swing",
  shuffle: "Shuffle",
  bossa: "Bossa",
  funk: "Funk",
};

export type BackingVoice = "bajo" | "acorde";

export interface BackingNote {
  /** posición en pulsos desde el principio de la rejilla */
  beat: number;
  /** duración en pulsos */
  duration: number;
  midi: number;
  /** 0-1, para que el groove tenga relieve */
  velocity: number;
  voice: BackingVoice;
}

/** Golpe del patrón: pulso dentro del compás, duración e intensidad. */
type Hit = readonly [beat: number, duration: number, velocity: number];
/** Nota del bajo: como un golpe, más el grado (0 = fundamental, 1 = 5ª). */
type BassHit = readonly [
  beat: number,
  duration: number,
  velocity: number,
  degree: number,
];

interface Groove {
  chord: readonly Hit[];
  bass: readonly BassHit[];
  /** las corcheas de contratiempo se retrasan a 2/3 del pulso */
  swing: boolean;
}

const GROOVES: Record<BackingStyle, Groove> = {
  recto: {
    chord: [
      [0, 1, 0.75],
      [2, 1, 0.55],
    ],
    bass: [
      [0, 1, 0.85, 0],
      [2, 1, 0.7, 1],
    ],
    swing: false,
  },
  // Freddie Green: el acorde en 2 y 4, el bajo caminando en negras
  swing: {
    chord: [
      [1, 0.9, 0.6],
      [3, 0.9, 0.7],
    ],
    bass: [
      [0, 1, 0.85, 0],
      [1, 1, 0.6, 1],
      [2, 1, 0.75, 0],
      [3, 1, 0.6, 1],
    ],
    swing: true,
  },
  shuffle: {
    chord: [
      [0.5, 0.5, 0.5],
      [1, 0.5, 0.7],
      [2.5, 0.5, 0.5],
      [3, 0.5, 0.7],
    ],
    bass: [
      [0, 1, 0.85, 0],
      [1, 1, 0.65, 1],
      [2, 1, 0.8, 0],
      [3, 1, 0.65, 1],
    ],
    swing: true,
  },
  bossa: {
    chord: [
      [0, 0.5, 0.7],
      [1.5, 0.5, 0.55],
      [2.5, 0.5, 0.65],
      [3.5, 0.5, 0.5],
    ],
    bass: [
      [0, 1.5, 0.85, 0],
      [2, 1, 0.7, 1],
      [3, 1, 0.7, 0],
    ],
    swing: false,
  },
  funk: {
    chord: [
      [0, 0.25, 0.85],
      [0.75, 0.25, 0.5],
      [1.5, 0.25, 0.7],
      [2.5, 0.25, 0.6],
      [3.25, 0.25, 0.55],
    ],
    bass: [
      [0, 0.5, 0.9, 0],
      [1.75, 0.25, 0.6, 0],
      [2, 0.5, 0.8, 1],
      [3.5, 0.5, 0.6, 0],
    ],
    swing: false,
  },
};

/**
 * Retrasa el contratiempo al segundo tercio del pulso. Los golpes que caen
 * en pulso entero no se tocan: el swing mueve las corcheas, no el tempo.
 */
function withSwing(beat: number, swing: boolean): number {
  if (!swing) return beat;
  const pulso = Math.floor(beat);
  const resto = beat - pulso;
  if (Math.abs(resto - 0.5) < 1e-9) return pulso + 2 / 3;
  return beat;
}

/** La nota `name` más grave que cae dentro del registro del bajo. */
export function bassMidi(name: NoteName): number {
  const pc = parseNote(name).pc;
  let midi = BASS_LOW + mod12(pc - BASS_LOW);
  if (midi > BASS_HIGH) midi -= 12;
  return midi;
}

/**
 * Digitación con la que se acompaña un cifrado. Entre las candidatas se
 * elige la más cercana a la anterior: es lo que evita que la armonía dé un
 * salto de octava en cada cambio de acorde.
 */
function compingMidis(chord: string, previous: number[] | null): number[] {
  const spec = parseFormulaSpec(chord, "chord");
  const candidatas = generateVoicings({
    root: spec.root,
    intervals: spec.intervals,
    tuningMidi: STANDARD,
    minStrings: 3,
    maxStrings: 4,
    maxSpan: 3,
    maxBaseFret: 10,
  });
  if (candidatas.length === 0) {
    // sin digitación tocable, la fórmula desnuda alrededor del centro
    return spec.intervals.map((_, i) => COMP_CENTER + i * 4);
  }

  const centro = (midis: number[]) =>
    midis.reduce((a, b) => a + b, 0) / Math.max(midis.length, 1);
  const objetivo = previous ? centro(previous) : COMP_CENTER;

  let mejor = candidatas[0];
  let mejorCoste = Infinity;
  for (const candidata of candidatas) {
    // distancia al acorde anterior, con un empujón a las digitaciones ricas
    const coste =
      Math.abs(centro(candidata.midis) - objetivo) + (4 - candidata.soundingStrings);
    if (coste < mejorCoste) {
      mejorCoste = coste;
      mejor = candidata;
    }
  }
  return mejor.midis;
}

export interface BackingOptions {
  style?: BackingStyle;
  beatsPerBar?: number;
}

/** Pulsos que dura la rejilla entera. */
export function backingLength(
  bars: readonly GridBar[],
  options: BackingOptions = {},
): number {
  return bars.length * (options.beatsPerBar ?? 4);
}

/**
 * Todas las notas de la base, ordenadas por pulso. Un compás con dos
 * cifrados se reparte entre los dos; un compás vacío ("%") repite el
 * anterior en vez de callarse.
 */
export function backingNotes(
  bars: readonly GridBar[],
  options: BackingOptions = {},
): BackingNote[] {
  const style = options.style ?? "recto";
  const beatsPerBar = options.beatsPerBar ?? 4;
  const groove = GROOVES[style];

  const notes: BackingNote[] = [];
  const cache = new Map<string, number[]>();
  let previous: number[] | null = null;
  let lastChords: string[] = [];

  bars.forEach((bar, barIndex) => {
    const chords = bar.chords.length > 0 ? bar.chords : lastChords;
    if (chords.length === 0) return;
    lastChords = chords;

    const span = beatsPerBar / chords.length;
    const barStart = barIndex * beatsPerBar;

    chords.forEach((chord, chordIndex) => {
      const from = barStart + chordIndex * span;
      const to = from + span;

      const spec = parseFormulaSpec(chord, "chord");
      const key = `${chord}|${previous?.join(",") ?? ""}`;
      const midis = cache.get(key) ?? compingMidis(chord, previous);
      cache.set(key, midis);
      previous = midis;

      const raiz = bassMidi(spec.root);
      // la 5ª por encima, o por debajo si se saldría del registro
      const quinta = raiz + 7 > BASS_HIGH ? raiz - 5 : raiz + 7;

      for (const [beat, duration, velocity, degree] of groove.bass) {
        const at = barStart + withSwing(beat, groove.swing);
        if (at < from || at >= to) continue;
        notes.push({
          beat: at,
          duration: Math.min(duration, to - at),
          midi: degree === 0 ? raiz : quinta,
          velocity,
          voice: "bajo",
        });
      }

      for (const [beat, duration, velocity] of groove.chord) {
        const at = barStart + withSwing(beat, groove.swing);
        if (at < from || at >= to) continue;
        for (const midi of midis) {
          notes.push({
            beat: at,
            duration: Math.min(duration, to - at),
            midi,
            velocity,
            voice: "acorde",
          });
        }
      }
    });
  });

  return notes.sort((a, b) => a.beat - b.beat || a.midi - b.midi);
}
