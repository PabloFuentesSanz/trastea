/**
 * Traduce lo que escribe un autor de contenido ("A minor-pentatonic", "Am7")
 * a la fórmula de intervalos que dibujan los componentes. Puro y testeado:
 * un slug mal escrito revienta en build, no dibuja un mástil equivocado.
 */

import { CHORDS } from "@/data/chords";
import { SCALES } from "@/data/scales";
import type { FretPosition } from "./fretboard";
import { midiAt } from "./fretboard";
import {
  keyPrefersFlats,
  mod12,
  parseNote,
  pcToName,
  toSolfege,
  type IntervalName,
  type NoteName,
} from "./notes";

export type FormulaKind = "scale" | "chord";

export interface FormulaSpec {
  root: NoteName;
  intervals: readonly IntervalName[];
  kind: FormulaKind;
  /** id en SCALES o CHORDS */
  id: string;
  /** "La menor pentatónica", para el aria-label del SVG */
  label: string;
}

export interface ParsedChordSymbol {
  root: NoteName;
  id: string;
}

/** Letra más alteraciones al principio de la cadena, o null. */
function leadingRoot(input: string): { root: NoteName; rest: string } | null {
  const match = /^([A-G])([#b]*)/.exec(input);
  if (!match) return null;
  return { root: `${match[1]}${match[2]}`, rest: input.slice(match[0].length) };
}

/**
 * Cifrado americano pegado: "Am7", "Cmaj7", "Bbm7b5". Gana el sufijo más
 * largo, así "Cmaj7" no se lee como "Cm" + "aj7".
 */
export function parseChordSymbol(symbol: string): ParsedChordSymbol | null {
  const head = leadingRoot(symbol.trim());
  if (!head) return null;

  const candidates = Object.values(CHORDS)
    .filter((chord) => chord.symbol === head.rest)
    .sort((a, b) => b.symbol.length - a.symbol.length);

  const hit = candidates[0];
  return hit ? { root: head.root, id: hit.id } : null;
}

function spanishRoot(root: NoteName): string {
  return toSolfege(root);
}

export function parseFormulaSpec(spec: string, kind: FormulaKind): FormulaSpec {
  const trimmed = spec.trim();
  const table = kind === "scale" ? SCALES : CHORDS;
  const spaceAt = trimmed.indexOf(" ");

  // Sin espacio y siendo acorde, es cifrado pegado: "Am7".
  if (spaceAt === -1) {
    if (kind === "chord") {
      const parsed = parseChordSymbol(trimmed);
      if (!parsed) throw new Error(`Acorde desconocido: "${spec}"`);
      const def = CHORDS[parsed.id];
      return {
        root: parsed.root,
        intervals: def.intervals,
        kind,
        id: def.id,
        label: `${spanishRoot(parsed.root)} ${def.name.toLowerCase()}`,
      };
    }
    throw new Error(`Falta la raíz o el tipo en: "${spec}"`);
  }

  const root = trimmed.slice(0, spaceAt);
  const id = trimmed.slice(spaceAt + 1).trim();

  // parseNote lanza si la raíz no es válida; que reviente aquí es lo correcto.
  parseNote(root);

  const def = table[id];
  if (!def) {
    throw new Error(
      `${kind === "scale" ? "Escala" : "Acorde"} desconocido: "${id}" (en "${spec}")`,
    );
  }

  return {
    root,
    intervals: def.intervals,
    kind,
    id: def.id,
    label: `${spanishRoot(root)} ${def.name.toLowerCase()}`,
  };
}

export interface PositionWindow {
  fromFret?: number;
  toFret?: number;
  /** numeración musical: 6 = Mi grave, 1 = Mi agudo */
  strings?: readonly number[];
}

/** Índice interno (0 = 6ª) desde el número de cuerda que escribe el autor. */
export function stringIndex(musicalString: number): number {
  return 6 - musicalString;
}

/** Recorta un conjunto de posiciones a una caja del mástil. */
export function windowPositions(
  positions: readonly FretPosition[],
  { fromFret, toFret, strings }: PositionWindow,
): FretPosition[] {
  const allowed = strings ? new Set(strings.map(stringIndex)) : null;
  return positions.filter((p) => {
    if (fromFret !== undefined && p.fret < fromFret) return false;
    if (toFret !== undefined && p.fret > toFret) return false;
    if (allowed && !allowed.has(p.string)) return false;
    return true;
  });
}

/** Semitonos desde la raíz → nombre de intervalo, para notas sueltas. */
const INTERVAL_BY_SEMITONE: readonly IntervalName[] = [
  "1",
  "b2",
  "2",
  "b3",
  "3",
  "4",
  "b5",
  "5",
  "b6",
  "6",
  "b7",
  "7",
];

export interface NoteSpec {
  /** numeración musical: 6 = Mi grave */
  string: number;
  fret: number;
}

/**
 * Notas sueltas escritas como "cuerda:traste": `"6:5, 5:7"`.
 * Es lo que necesitan los intervalos y los ejercicios, donde no hay fórmula
 * que valga: son unas notas concretas en unos trastes concretos.
 */
export function parseNoteSpec(spec: string): NoteSpec[] {
  const parts = spec
    .split(/[,]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) throw new Error(`Sin notas en: "${spec}"`);

  return parts.map((part) => {
    const match = /^([1-6]):(\d{1,2})$/.exec(part);
    if (!match) {
      throw new Error(
        `Nota inválida: "${part}" (en "${spec}"). Se escribe cuerda:traste, p. ej. 6:5`,
      );
    }
    const string = Number(match[1]);
    const fret = Number(match[2]);
    if (string < 1 || string > 6)
      throw new Error(`Cuerda fuera de la guitarra: "${part}"`);
    if (fret > 24) throw new Error(`Traste fuera del mástil: "${part}"`);
    return { string, fret };
  });
}

/**
 * Convierte notas sueltas en posiciones dibujables, nombrando cada intervalo
 * respecto a `root` (o a la primera nota si no se da).
 */
export function positionsFromNotes(
  notes: readonly NoteSpec[],
  tuningMidi: readonly number[],
  root?: NoteName,
): FretPosition[] {
  const midis = notes.map((n) => midiAt(tuningMidi, stringIndex(n.string), n.fret));
  const rootPc = root !== undefined ? parseNote(root).pc : mod12(midis[0]);
  const flats = keyPrefersFlats(root ?? pcToName(rootPc));

  return notes.map((note, i) => {
    const midi = midis[i];
    const pc = mod12(midi);
    const semitones = mod12(pc - rootPc);
    const interval = INTERVAL_BY_SEMITONE[semitones];
    return {
      string: stringIndex(note.string),
      fret: note.fret,
      midi,
      pc,
      degreeIndex: semitones,
      note: pcToName(pc, flats),
      interval,
      isRoot: semitones === 0,
    };
  });
}

/**
 * Posiciones de `notes` que NO suenan la nota `pitch`, como "3:2".
 * Un mapa de octavas es una sola nota repartida por el mástil; equivocarse en
 * una posición no se ve mirando el dibujo, así que se comprueba.
 */
export function notesThatArent(
  notes: readonly NoteSpec[],
  tuningMidi: readonly number[],
  pitch: NoteName,
): string[] {
  const target = parseNote(pitch).pc;
  return notes
    .filter((n) => mod12(midiAt(tuningMidi, stringIndex(n.string), n.fret)) !== target)
    .map((n) => `${n.string}:${n.fret}`);
}
