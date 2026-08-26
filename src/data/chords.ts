import type { IntervalName } from "@/lib/music/notes";

export interface ChordDef {
  id: string;
  name: string;
  /** Sufijo de cifrado americano: "", "m", "maj7", "7", "m7b5"… */
  symbol: string;
  intervals: readonly IntervalName[];
  category: "triada" | "septima" | "sexta" | "suspendido" | "extension";
}

export const CHORDS: Record<string, ChordDef> = {
  major: {
    id: "major",
    name: "Tríada mayor",
    symbol: "",
    intervals: ["1", "3", "5"],
    category: "triada",
  },
  minor: {
    id: "minor",
    name: "Tríada menor",
    symbol: "m",
    intervals: ["1", "b3", "5"],
    category: "triada",
  },
  diminished: {
    id: "diminished",
    name: "Tríada disminuida",
    symbol: "dim",
    intervals: ["1", "b3", "b5"],
    category: "triada",
  },
  augmented: {
    id: "augmented",
    name: "Tríada aumentada",
    symbol: "aug",
    intervals: ["1", "3", "#5"],
    category: "triada",
  },
  sus2: {
    id: "sus2",
    name: "Suspendido 2",
    symbol: "sus2",
    intervals: ["1", "2", "5"],
    category: "suspendido",
  },
  sus4: {
    id: "sus4",
    name: "Suspendido 4",
    symbol: "sus4",
    intervals: ["1", "4", "5"],
    category: "suspendido",
  },
  maj7: {
    id: "maj7",
    name: "Mayor séptima",
    symbol: "maj7",
    intervals: ["1", "3", "5", "7"],
    category: "septima",
  },
  "7": {
    id: "7",
    name: "Dominante",
    symbol: "7",
    intervals: ["1", "3", "5", "b7"],
    category: "septima",
  },
  m7: {
    id: "m7",
    name: "Menor séptima",
    symbol: "m7",
    intervals: ["1", "b3", "5", "b7"],
    category: "septima",
  },
  m7b5: {
    id: "m7b5",
    name: "Semidisminuido",
    symbol: "m7b5",
    intervals: ["1", "b3", "b5", "b7"],
    category: "septima",
  },
  dim7: {
    id: "dim7",
    name: "Disminuido séptima",
    symbol: "dim7",
    intervals: ["1", "b3", "b5", "bb7"],
    category: "septima",
  },
  mMaj7: {
    id: "mMaj7",
    name: "Menor con séptima mayor",
    symbol: "m(maj7)",
    intervals: ["1", "b3", "5", "7"],
    category: "septima",
  },
  "6": {
    id: "6",
    name: "Sexta",
    symbol: "6",
    intervals: ["1", "3", "5", "6"],
    category: "sexta",
  },
  m6: {
    id: "m6",
    name: "Menor sexta",
    symbol: "m6",
    intervals: ["1", "b3", "5", "6"],
    category: "sexta",
  },
  "9": {
    id: "9",
    name: "Dominante novena",
    symbol: "9",
    intervals: ["1", "3", "5", "b7", "9"],
    category: "extension",
  },
  maj9: {
    id: "maj9",
    name: "Mayor novena",
    symbol: "maj9",
    intervals: ["1", "3", "5", "7", "9"],
    category: "extension",
  },
  m9: {
    id: "m9",
    name: "Menor novena",
    symbol: "m9",
    intervals: ["1", "b3", "5", "b7", "9"],
    category: "extension",
  },
};

export type ChordId = keyof typeof CHORDS;

export function getChord(id: string): ChordDef {
  const chord = CHORDS[id];
  if (!chord) throw new Error(`Acorde desconocido: "${id}"`);
  return chord;
}
