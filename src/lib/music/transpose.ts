/**
 * Transportar cifrados y rejillas. Lo necesita cualquier cosa que permita
 * cambiar de tono: la misma forma en los doce tonos es medio estudio del
 * jazz y del blues.
 *
 * La gracia está en la escritura. Deletrear por la tonalidad de destino no
 * basta: el bII7 de Re es Mib7, no Re#7, aunque Re prefiera sostenidos. Se
 * transporta por INTERVALO desde la tónica, que es lo que conserva el papel
 * que hace cada acorde.
 */

import { intervalBetween, transpose, type NoteName } from "./notes";

/** Letra más alteraciones al principio, o null si no empieza por nota. */
function leadingRoot(input: string): { root: NoteName; rest: string } | null {
  const match = /^([A-G])([#b]*)/.exec(input);
  if (!match) return null;
  return { root: `${match[1]}${match[2]}`, rest: input.slice(match[0].length) };
}

/**
 * Lleva un cifrado del tono `fromKey` al tono `toKey` conservando el papel
 * que hacía. Un cifrado que no se entiende se devuelve tal cual: aquí no se
 * inventa nada.
 */
export function transposeChord(
  symbol: string,
  fromKey: NoteName,
  toKey: NoteName,
): string {
  const parsed = leadingRoot(symbol.trim());
  if (!parsed) return symbol;

  let nuevaRaiz: NoteName;
  try {
    nuevaRaiz = transpose(toKey, intervalBetween(fromKey, parsed.root));
  } catch {
    return symbol;
  }

  // el bajo de un slash chord también viaja: "Cmaj7/E"
  const barra = parsed.rest.indexOf("/");
  if (barra === -1) return `${nuevaRaiz}${parsed.rest}`;

  const cualidad = parsed.rest.slice(0, barra);
  const bajo = parsed.rest.slice(barra + 1);
  return `${nuevaRaiz}${cualidad}/${transposeChord(bajo, fromKey, toKey)}`;
}

/**
 * Lleva una rejilla entera a otro tono conservando su forma: las barras de
 * compás, los compases con dos acordes y los "%" de repetición.
 */
export function transposeGrid(spec: string, fromKey: NoteName, toKey: NoteName): string {
  return spec
    .split("|")
    .map((bar) =>
      bar
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((chord) => (chord === "%" ? chord : transposeChord(chord, fromKey, toKey)))
        .join(" "),
    )
    .join(" | ");
}
