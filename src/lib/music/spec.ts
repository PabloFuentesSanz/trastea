/**
 * Traduce lo que escribe un autor de contenido ("A minor-pentatonic", "Am7")
 * a la fórmula de intervalos que dibujan los componentes. Puro y testeado:
 * un slug mal escrito revienta en build, no dibuja un mástil equivocado.
 */

import { CHORDS } from "@/data/chords";
import { SCALES } from "@/data/scales";
import type { FretPosition } from "./fretboard";
import { parseNote, toSolfege, type IntervalName, type NoteName } from "./notes";

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
