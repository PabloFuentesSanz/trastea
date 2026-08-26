/**
 * Mazo de tarjetas de mástil: qué se pregunta y cómo se corrige.
 * Puro: no sabe nada de la base de datos ni de React.
 */

import { mod12, pcToName, type NoteName } from "@/lib/music/notes";
import { TUNINGS } from "@/data/tunings";

export interface FretboardNoteCard {
  type: "fretboard_note";
  /** índice de cuerda 0 = 6ª grave … 5 = 1ª aguda */
  string: number;
  fret: number;
}

/** Identificador estable de una tarjeta (clave en base de datos). */
export function cardId(card: FretboardNoteCard): string {
  return `${card.type}:${card.string}:${card.fret}`;
}

export function parseCardId(id: string): FretboardNoteCard | null {
  const [type, string, fret] = id.split(":");
  if (type !== "fretboard_note") return null;
  const s = Number(string);
  const f = Number(fret);
  if (!Number.isInteger(s) || !Number.isInteger(f)) return null;
  return { type: "fretboard_note", string: s, fret: f };
}

/** Nota correcta de la tarjeta, en la afinación indicada. */
export function answerFor(
  card: FretboardNoteCard,
  tuningId = "standard",
): { pc: number; sharp: NoteName; flat: NoteName } {
  const tuning = TUNINGS[tuningId] ?? TUNINGS.standard;
  const midi = tuning.midi[card.string] + card.fret;
  const pc = mod12(midi);
  return { pc, sharp: pcToName(pc, false), flat: pcToName(pc, true) };
}

/** ¿La respuesta dada es la correcta? Acepta enarmonías (A# = Bb). */
export function isCorrect(
  card: FretboardNoteCard,
  answerPc: number,
  tuningId = "standard",
): boolean {
  return mod12(answerPc) === answerFor(card, tuningId).pc;
}

export interface DeckOptions {
  /** cuerdas a incluir, en índices 0-5. Por defecto todas. */
  strings?: readonly number[];
  /** traste máximo (el 0 al aire siempre entra) */
  maxFret?: number;
}

/**
 * Genera el mazo completo de notas del mástil.
 * Por defecto trastes 0-12 en las 6 cuerdas: 78 tarjetas.
 */
export function buildFretboardDeck(options: DeckOptions = {}): FretboardNoteCard[] {
  const { strings = [0, 1, 2, 3, 4, 5], maxFret = 12 } = options;
  const cards: FretboardNoteCard[] = [];
  for (const string of strings) {
    for (let fret = 0; fret <= maxFret; fret++) {
      cards.push({ type: "fretboard_note", string, fret });
    }
  }
  return cards;
}

/** Las 12 opciones de respuesta, en orden cromático desde Do. */
export const ANSWER_OPTIONS: { pc: number; label: NoteName }[] = Array.from(
  { length: 12 },
  (_, pc) => ({ pc, label: pcToName(pc, false) }),
);

/** Cuerda en numeración de guitarrista (6ª = la más grave). */
export function guitarStringNumber(stringIndex: number): number {
  return 6 - stringIndex;
}
