/**
 * Capo: la diferencia entre lo que tocas y lo que suena.
 *
 * Convención del catálogo: `chords` son **las formas** que hace la mano y
 * `key` es **la tonalidad que suena**. Con un capo en el traste 3, las formas
 * de Do suenan en Mib. Escribir `key: "C"` con `capo: 3` es decir dos cosas
 * incompatibles, y en la ficha se lee como si la canción estuviera en Do.
 */

import { mod12, parseNote, PRACTICAL_ROOTS, type NoteName } from "@/lib/music/notes";

/**
 * Las doce raíces menores como se escriben de verdad. No coinciden con
 * PRACTICAL_ROOTS: en mayor se escribe Reb, pero nadie escribe Rebm —esa
 * tonalidad se llama Do#m—. Lo mismo con Lab y Sol#m.
 */
const MINOR_ROOTS: readonly NoteName[] = [
  "C",
  "C#",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "Bb",
  "B",
];

/** Un sufijo es menor si empieza por "m" y no es "maj". */
function isMinor(suffix: string): boolean {
  return /^m(?!aj)/.test(suffix);
}

export interface SongKeyFields {
  key: string;
  chords?: readonly string[];
  capo?: number;
}

export interface CapoMismatch {
  /** tonalidad de las formas, deducida del primer acorde */
  forma: string;
  /** lo que debería decir `key` */
  esperado: string;
  /** lo que dice ahora */
  declarado: string;
  capo: number;
}

/** Separa "Am" en raíz y sufijo; "C#m" → { root: "C#", suffix: "m" }. */
function split(name: string): { root: NoteName; suffix: string } | null {
  const match = /^([A-G][#b]?)(.*)$/.exec(name.trim());
  if (!match) return null;
  try {
    parseNote(match[1]);
  } catch {
    return null;
  }
  return { root: match[1], suffix: match[2] };
}

/**
 * Lo que suena al tocar `shapeKey` con el capo en el traste `capo`.
 * Sube por semitonos resolviendo la escritura práctica: Mib, no Re#.
 */
export function soundingKey(shapeKey: string, capo: number | undefined): string {
  const frets = capo ?? 0;
  const parts = split(shapeKey);
  if (frets <= 0 || !parts) return shapeKey;

  const tabla = isMinor(parts.suffix) ? MINOR_ROOTS : PRACTICAL_ROOTS;
  const destino = mod12(parseNote(parts.root).pc + frets);
  return `${tabla[destino]}${parts.suffix}`;
}

/** La tonalidad de las formas: "Cadd9" → "C", "Em7" → "Em". */
export function shapeRoot(chord: string): string {
  const parts = split(chord);
  if (!parts) return chord;
  return `${parts.root}${isMinor(parts.suffix) ? "m" : ""}`;
}

/**
 * Devuelve el desajuste si `key`, `chords` y `capo` no pueden ser los tres
 * ciertos a la vez, o null si la ficha es coherente (o no hay datos para
 * decidirlo).
 */
export function capoCoherence({ key, chords, capo }: SongKeyFields): CapoMismatch | null {
  const frets = capo ?? 0;
  const primero = chords?.[0];
  if (frets <= 0 || !primero) return null;

  const forma = split(primero);
  if (!forma) return null;

  const declarada = split(key);
  const esperado = soundingKey(primero, frets);
  const esperada = split(esperado);

  // Se comparan raíz y modo, no el cifrado entero: una canción cuyo primer
  // acorde es Em7 está en Mi menor, no en "Mi menor séptima".
  if (
    declarada &&
    esperada &&
    parseNote(declarada.root).pc === parseNote(esperada.root).pc &&
    isMinor(declarada.suffix) === isMinor(esperada.suffix)
  ) {
    return null;
  }

  return { forma: primero, esperado, declarado: key.trim(), capo: frets };
}
