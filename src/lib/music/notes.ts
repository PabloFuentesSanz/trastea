/**
 * Lógica musical pura: notas, clases de altura, intervalos y enarmonías.
 * Sin dependencia alguna de UI ni de audio.
 */

export type NoteLetter = "C" | "D" | "E" | "F" | "G" | "A" | "B";

/** 0 = C, 1 = C#/Db … 11 = B */
export type PitchClass = number;

/** Nombre de nota con alteración, p. ej. "C", "F#", "Bb", "E#", "Cbb". */
export type NoteName = string & { readonly __brand?: "NoteName" };

/** Intervalo en notación de grados: "1", "b3", "#4", "b7", "9", "#11"… */
export type IntervalName = string & { readonly __brand?: "IntervalName" };

export const LETTERS: readonly NoteLetter[] = ["C", "D", "E", "F", "G", "A", "B"];

const LETTER_PC: Record<NoteLetter, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/** Semitonos del grado mayor/justo correspondiente (1-based, con extensiones). */
const DEGREE_SEMITONES: Record<number, number> = {
  1: 0,
  2: 2,
  3: 4,
  4: 5,
  5: 7,
  6: 9,
  7: 11,
  8: 12,
  9: 14,
  10: 16,
  11: 17,
  12: 19,
  13: 21,
};

export interface ParsedNote {
  letter: NoteLetter;
  /** -2 (doble bemol) … +2 (doble sostenido) */
  accidental: number;
  pc: PitchClass;
}

export function mod12(n: number): PitchClass {
  return ((n % 12) + 12) % 12;
}

export function parseNote(name: NoteName): ParsedNote {
  const m = /^([A-G])(bb|b|##|#|x)?$/.exec(name);
  if (!m) throw new Error(`Nota inválida: "${name}"`);
  const letter = m[1] as NoteLetter;
  const accStr = m[2] ?? "";
  const accidental =
    accStr === "bb"
      ? -2
      : accStr === "b"
        ? -1
        : accStr === ""
          ? 0
          : accStr === "#"
            ? 1
            : 2;
  return { letter, accidental, pc: mod12(LETTER_PC[letter] + accidental) };
}

export function accidentalToString(accidental: number): string {
  if (accidental === 0) return "";
  if (accidental > 0) return "#".repeat(accidental);
  return "b".repeat(-accidental);
}

export function noteToString(letter: NoteLetter, accidental: number): NoteName {
  return `${letter}${accidentalToString(accidental)}`;
}

export interface ParsedInterval {
  /** Grado 1-based (1..13) */
  degree: number;
  /** Alteración respecto al grado mayor/justo: -2..2 */
  alteration: number;
  /** Semitonos desde la raíz */
  semitones: number;
}

export function parseInterval(name: IntervalName): ParsedInterval {
  const m = /^(bb|b|##|#)?(\d{1,2})$/.exec(name);
  if (!m) throw new Error(`Intervalo inválido: "${name}"`);
  const alteration =
    m[1] === "bb" ? -2 : m[1] === "b" ? -1 : m[1] === "#" ? 1 : m[1] === "##" ? 2 : 0;
  const degree = Number(m[2]);
  const base = DEGREE_SEMITONES[degree];
  if (base === undefined) throw new Error(`Grado fuera de rango: "${name}"`);
  return { degree, alteration, semitones: base + alteration };
}

/**
 * Transporta una raíz por un intervalo respetando la ortografía musical:
 * la letra avanza (grado − 1) posiciones y la alteración se deduce de la
 * diferencia de semitonos. En Fa mayor el 4º grado es Sib, no La#.
 */
export function transpose(root: NoteName, interval: IntervalName): NoteName {
  const note = parseNote(root);
  const iv = parseInterval(interval);
  const letterIndex = LETTERS.indexOf(note.letter);
  const targetLetter = LETTERS[(letterIndex + iv.degree - 1) % 7];
  const targetPc = mod12(note.pc + iv.semitones);
  let accidental = targetPc - LETTER_PC[targetLetter];
  // Normaliza al equivalente en [-2, 2] más cercano
  if (accidental > 6) accidental -= 12;
  if (accidental < -6) accidental += 12;
  return noteToString(targetLetter, accidental);
}

/** Deletrea una fórmula de intervalos desde una raíz. */
export function spellFormula(
  root: NoteName,
  intervals: readonly IntervalName[],
): NoteName[] {
  return intervals.map((iv) => transpose(root, iv));
}

export function semitonesOf(intervals: readonly IntervalName[]): number[] {
  return intervals.map((iv) => mod12(parseInterval(iv).semitones));
}

/** Nombres cromáticos con sostenidos o bemoles (para contexto sin tonalidad). */
const SHARP_NAMES: readonly NoteName[] = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
const FLAT_NAMES: readonly NoteName[] = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

export function pcToName(pc: PitchClass, preferFlats = false): NoteName {
  return (preferFlats ? FLAT_NAMES : SHARP_NAMES)[mod12(pc)];
}

/** Tonalidades mayores que se escriben con bemoles. */
const FLAT_MAJOR_KEYS = new Set(["F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"]);

export function keyPrefersFlats(keyRoot: NoteName): boolean {
  const parsed = parseNote(keyRoot);
  if (parsed.accidental < 0) return true;
  if (parsed.accidental > 0) return false;
  return FLAT_MAJOR_KEYS.has(parsed.letter);
}

/** Las 12 raíces prácticas para selectores de tono. */
export const PRACTICAL_ROOTS: readonly NoteName[] = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

/** Nombre en solfeo (para textos en español): C → Do, Bb → Sib. */
const SOLFEGE: Record<NoteLetter, string> = {
  C: "Do",
  D: "Re",
  E: "Mi",
  F: "Fa",
  G: "Sol",
  A: "La",
  B: "Si",
};

export function toSolfege(name: NoteName): string {
  const { letter, accidental } = parseNote(name);
  return `${SOLFEGE[letter]}${accidentalToString(accidental)}`;
}
