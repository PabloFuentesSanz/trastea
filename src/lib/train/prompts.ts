/**
 * El enunciado de cada tarjeta y cuál era la respuesta buena.
 *
 * Puro y aparte del componente para poder comprobar lo que más importa: que
 * **la pregunta no se chive de la respuesta**. En los ejercicios de oído eso
 * no es un detalle estético — si el enunciado dice el intervalo, el ejercicio
 * no existe.
 */

import { CHORDS } from "@/data/chords";
import { mod12, pcToName, spellFormula, type NoteName } from "@/lib/music/notes";
import { chordPitchClasses, midiAt, type TrainCard } from "./cards";
import { intervalLabel, intervalMnemonic } from "./intervals";

export interface CardPrompt {
  question: string;
  /** cómo se enseña la respuesta al corregir */
  answerLabel: string;
  /** ayuda que se puede mostrar al fallar */
  hint?: string;
}

/** Cuerda en numeración de guitarrista: el índice 0 es la 6ª. */
export function guitarStringNumber(stringIndex: number): number {
  return 6 - stringIndex;
}

function noteAt(position: { string: number; fret: number }): {
  sharp: NoteName;
  flat: NoteName;
} {
  const pc = mod12(midiAt(position));
  return { sharp: pcToName(pc, false), flat: pcToName(pc, true) };
}

function noteLabel(position: { string: number; fret: number }): string {
  const { sharp, flat } = noteAt(position);
  return sharp === flat ? sharp : `${sharp} (o ${flat})`;
}

function chordSymbol(root: NoteName, chordId: string): string {
  return `${root}${CHORDS[chordId]?.symbol ?? ""}`;
}

function chordNotes(root: NoteName, chordId: string): string {
  const def = CHORDS[chordId];
  if (!def) return "";
  return spellFormula(root, def.intervals).join(" · ");
}

export function promptFor(card: TrainCard): CardPrompt {
  switch (card.type) {
    case "fretboard_note":
      return {
        question: `¿Qué nota es la cuerda ${guitarStringNumber(card.string)}, traste ${card.fret}?`,
        answerLabel: noteLabel(card),
      };

    case "interval_name": {
      const semitones = midiAt(card.to) - midiAt(card.from);
      return {
        question: "¿Qué intervalo hay entre las dos notas marcadas?",
        answerLabel: intervalLabel(semitones),
        hint: `De ${noteAt(card.from).sharp} a ${noteAt(card.to).sharp}`,
      };
    }

    case "interval_build": {
      const desde = noteAt(card.from).sharp;
      const objetivo = mod12(midiAt(card.from) + card.semitones);
      return {
        question: `Desde ${desde} (cuerda ${guitarStringNumber(card.from.string)}, traste ${card.from.fret}), toca su ${intervalLabel(card.semitones)}`,
        answerLabel: `${pcToName(objetivo, false)} — vale en cualquier cuerda donde esté esa altura`,
      };
    }

    case "chord_notes":
      return {
        question: `¿Qué notas forman ${chordSymbol(card.root, card.chordId)}?`,
        answerLabel: chordNotes(card.root, card.chordId),
        hint: `${chordPitchClasses(card.root, card.chordId).length} notas`,
      };

    case "ear_interval":
      return {
        question: "Escucha las dos notas: ¿qué intervalo era?",
        answerLabel: intervalLabel(card.semitones),
        hint: intervalMnemonic(card.semitones),
      };

    case "ear_chord":
      return {
        question: "Escucha el acorde: ¿de qué tipo era?",
        answerLabel: CHORDS[card.chordId]?.name ?? card.chordId,
      };
  }
}
