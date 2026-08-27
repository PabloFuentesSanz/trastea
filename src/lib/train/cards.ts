/**
 * Las tarjetas del centro de entrenamiento: qué se pregunta y cómo se corrige.
 *
 * Puro: no sabe de React ni de base de datos. El mazo vive en código y la base
 * de datos solo guarda el progreso, así que **el id tiene que identificar la
 * tarjeta por completo** — de un id se reconstruye la pregunta entera.
 *
 * Las de oído no llevan la nota de partida en el id a propósito: lo que se
 * entrena es reconocer el intervalo, no reconocerlo *desde Do*. La raíz se
 * sortea al tocarla.
 */

import { CHORDS } from "@/data/chords";
import { getTuning } from "@/data/tunings";
import {
  mod12,
  parseInterval,
  parseNote,
  semitonesOf,
  type NoteName,
} from "@/lib/music/notes";

export interface Position {
  /** índice de cuerda 0 = 6ª grave … 5 = 1ª aguda */
  string: number;
  fret: number;
}

export interface FretboardNoteCard {
  type: "fretboard_note";
  string: number;
  fret: number;
}

/** Dos posiciones marcadas: ¿qué intervalo hay entre ellas? */
export interface IntervalNameCard {
  type: "interval_name";
  from: Position;
  to: Position;
}

/** Una posición y un intervalo: toca la nota que queda a esa distancia. */
export interface IntervalBuildCard {
  type: "interval_build";
  from: Position;
  /** hacia arriba; negativo sería hacia abajo */
  semitones: number;
}

/** Un cifrado: ¿de qué notas se compone? */
export interface ChordNotesCard {
  type: "chord_notes";
  root: NoteName;
  chordId: string;
}

/** Suenan dos notas: ¿qué intervalo era? */
export interface EarIntervalCard {
  type: "ear_interval";
  semitones: number;
}

/** Suena un acorde: ¿de qué tipo era? */
export interface EarChordCard {
  type: "ear_chord";
  chordId: string;
}

export type TrainCard =
  | FretboardNoteCard
  | IntervalNameCard
  | IntervalBuildCard
  | ChordNotesCard
  | EarIntervalCard
  | EarChordCard;

export type CardType = TrainCard["type"];

export const CARD_TYPES: readonly CardType[] = [
  "fretboard_note",
  "interval_name",
  "interval_build",
  "chord_notes",
  "ear_interval",
  "ear_chord",
];

const STRINGS = 6;
const MAX_SEMITONES = 24;

// ---------- alturas y posiciones ----------

/** Nota MIDI que suena en una posición. */
export function midiAt(position: Position, tuningId = "standard"): number {
  return getTuning(tuningId).midi[position.string] + position.fret;
}

/** Semitonos de `from` a `to`; negativo si `to` es más grave. */
export function intervalBetweenPositions(
  from: Position,
  to: Position,
  tuningId = "standard",
): number {
  return midiAt(to, tuningId) - midiAt(from, tuningId);
}

/** Todas las formas de tocar exactamente esa altura dentro del alcance. */
export function positionsForPitch(
  midi: number,
  { maxFret = 12, tuningId = "standard" }: { maxFret?: number; tuningId?: string } = {},
): Position[] {
  const tuning = getTuning(tuningId);
  const found: Position[] = [];
  for (let string = 0; string < STRINGS; string += 1) {
    const fret = midi - tuning.midi[string];
    if (fret >= 0 && fret <= maxFret) found.push({ string, fret });
  }
  return found;
}

// ---------- identidad ----------

export function cardId(card: TrainCard): string {
  switch (card.type) {
    case "fretboard_note":
      return `fretboard_note:${card.string}:${card.fret}`;
    case "interval_name":
      return `interval_name:${card.from.string}:${card.from.fret}:${card.to.string}:${card.to.fret}`;
    case "interval_build":
      return `interval_build:${card.from.string}:${card.from.fret}:${card.semitones}`;
    case "chord_notes":
      return `chord_notes:${card.root}:${card.chordId}`;
    case "ear_interval":
      return `ear_interval:${card.semitones}`;
    case "ear_chord":
      return `ear_chord:${card.chordId}`;
  }
}

function int(raw: string | undefined): number | null {
  if (raw === undefined || !/^-?\d+$/.test(raw)) return null;
  return Number(raw);
}

function position(s: string | undefined, f: string | undefined): Position | null {
  const string = int(s);
  const fret = int(f);
  if (string === null || fret === null) return null;
  if (string < 0 || string >= STRINGS || fret < 0 || fret > 24) return null;
  return { string, fret };
}

function isNote(raw: string | undefined): raw is NoteName {
  if (!raw) return false;
  try {
    parseNote(raw);
    return true;
  } catch {
    return false;
  }
}

/** Reconstruye la tarjeta desde su id, o null si el id no es de fiar. */
export function parseCardId(id: string): TrainCard | null {
  const parts = id.split(":");
  const [type] = parts;

  switch (type) {
    case "fretboard_note": {
      if (parts.length !== 3) return null;
      const p = position(parts[1], parts[2]);
      return p ? { type, string: p.string, fret: p.fret } : null;
    }
    case "interval_name": {
      if (parts.length !== 5) return null;
      const from = position(parts[1], parts[2]);
      const to = position(parts[3], parts[4]);
      return from && to ? { type, from, to } : null;
    }
    case "interval_build": {
      if (parts.length !== 4) return null;
      const from = position(parts[1], parts[2]);
      const semitones = int(parts[3]);
      if (!from || semitones === null) return null;
      if (Math.abs(semitones) > MAX_SEMITONES) return null;
      return { type, from, semitones };
    }
    case "chord_notes": {
      if (parts.length !== 3) return null;
      if (!isNote(parts[1]) || !(parts[2] in CHORDS)) return null;
      return { type, root: parts[1], chordId: parts[2] };
    }
    case "ear_interval": {
      if (parts.length !== 2) return null;
      const semitones = int(parts[1]);
      if (semitones === null || semitones < 0 || semitones > MAX_SEMITONES) return null;
      return { type, semitones };
    }
    case "ear_chord": {
      if (parts.length !== 2 || !(parts[1] in CHORDS)) return null;
      return { type, chordId: parts[1] };
    }
    default:
      return null;
  }
}

// ---------- corrección ----------

/**
 * Lo que responde quien entrena. Cada tarjeta mira solo su campo: responder
 * con la forma equivocada es un fallo, no una excepción.
 */
export interface Answer {
  /** clase de altura 0-11, para nombres de nota */
  pc?: number;
  /** semitonos, para intervalos */
  semitones?: number;
  /** posición tocada en el mástil */
  position?: Position;
  /** conjunto de clases de altura, para acordes */
  pcs?: readonly number[];
  /** id de acorde */
  chordId?: string;
}

/** Las clases de altura de un acorde, sin repetir. */
export function chordPitchClasses(root: NoteName, chordId: string): number[] {
  const def = CHORDS[chordId];
  if (!def) return [];
  const rootPc = parseNote(root).pc;
  return [...new Set(semitonesOf(def.intervals).map((s) => mod12(rootPc + s)))].sort(
    (a, b) => a - b,
  );
}

/**
 * Los semitonos del acorde SIN plegar la octava: la novena son 14, no 2. Es
 * lo que hace falta para tocarlo, porque una novena por debajo de la tercera
 * ya no es una novena.
 */
export function chordSemitones(chordId: string): number[] {
  const def = CHORDS[chordId];
  if (!def) return [];
  return def.intervals.map((iv) => parseInterval(iv).semitones);
}

export function checkAnswer(
  card: TrainCard,
  answer: Answer,
  tuningId = "standard",
): boolean {
  switch (card.type) {
    case "fretboard_note": {
      if (answer.pc === undefined) return false;
      return mod12(answer.pc) === mod12(midiAt(card, tuningId));
    }
    case "interval_name": {
      if (answer.semitones === undefined) return false;
      return answer.semitones === intervalBetweenPositions(card.from, card.to, tuningId);
    }
    case "interval_build": {
      if (!answer.position) return false;
      const objetivo = midiAt(card.from, tuningId) + card.semitones;
      return midiAt(answer.position, tuningId) === objetivo;
    }
    case "chord_notes": {
      if (!answer.pcs) return false;
      const dadas = [...new Set(answer.pcs.map(mod12))].sort((a, b) => a - b);
      const esperadas = chordPitchClasses(card.root, card.chordId);
      return (
        dadas.length === esperadas.length && dadas.every((pc, i) => pc === esperadas[i])
      );
    }
    case "ear_interval": {
      if (answer.semitones === undefined) return false;
      return answer.semitones === card.semitones;
    }
    case "ear_chord": {
      if (answer.chordId === undefined) return false;
      return answer.chordId === card.chordId;
    }
  }
}
