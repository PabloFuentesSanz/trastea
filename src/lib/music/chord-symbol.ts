/**
 * Traduce un cifrado americano ("Am7", "F#m7b5", "Bbmaj7") a los parámetros
 * que entiende /acordes, para que las fichas de canción puedan enlazar al
 * explorador con el acorde ya cargado.
 *
 * Si el sufijo no está en el vocabulario de /src/data/chords (add9, 7#9, 5…)
 * devolvemos solo la tónica: mejor llevar al sitio correcto sin el tipo que
 * inventarse un acorde que no es el de la canción.
 */

import { PRACTICAL_ROOTS, parseNote, type NoteName } from "./notes";

/** Sufijo del cifrado → id de /src/data/chords.ts */
const SUFFIX_TO_TYPE: Record<string, string> = {
  "": "major",
  M: "major",
  maj: "major",
  m: "minor",
  min: "minor",
  dim: "diminished",
  o: "diminished",
  aug: "augmented",
  "+": "augmented",
  sus2: "sus2",
  sus: "sus4",
  sus4: "sus4",
  maj7: "maj7",
  M7: "maj7",
  "7": "7",
  m7: "m7",
  min7: "m7",
  m7b5: "m7b5",
  ø: "m7b5",
  dim7: "dim7",
  o7: "dim7",
  "m(maj7)": "mMaj7",
  mMaj7: "mMaj7",
  "6": "6",
  m6: "m6",
  "9": "9",
  maj9: "maj9",
  m9: "m9",
};

/** Tónica práctica (la que /acordes acepta) para cada altura. */
const PRACTICAL_BY_PITCH = new Map<number, NoteName>(
  PRACTICAL_ROOTS.map((root) => [parseNote(root).pc, root]),
);

export interface ParsedChordSymbol {
  root: NoteName;
  /** ausente si el sufijo no está en el vocabulario de acordes */
  type?: string;
}

export function parseChordSymbol(symbol: string): ParsedChordSymbol | null {
  const match = /^([A-G](?:#|b)?)(.*)$/.exec(symbol.trim());
  if (!match) return null;

  const pitch = parseNote(match[1]).pc;
  const root = PRACTICAL_BY_PITCH.get(pitch);
  if (!root) return null;

  return { root, type: SUFFIX_TO_TYPE[match[2]] };
}

/** Enlace a /acordes con el acorde precargado, o null si no es un cifrado. */
export function chordToolHref(symbol: string): string | null {
  const parsed = parseChordSymbol(symbol);
  if (!parsed) return null;
  const params = new URLSearchParams({ root: parsed.root });
  if (parsed.type) params.set("type", parsed.type);
  return `/acordes?${params.toString()}`;
}
