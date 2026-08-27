/**
 * Rejilla de acordes: la forma de un tema escrita como se lee en un real
 * book. "A7 | A7 | D7 | A7", un acorde (o varios) por compás.
 *
 * Puro y testeado: los cifrados se validan contra la fórmula, así que un
 * acorde inventado en la forma de un blues revienta el build.
 */

import { parseFormulaSpec } from "./spec";

export interface GridBar {
  /** cifrados que suenan en el compás; vacío = repite el anterior */
  chords: string[];
}

/** "A7 | A7 | Cm7 F7 | %" → cuatro compases, el último repite el anterior. */
export function parseGrid(spec: string): GridBar[] {
  const bars = spec
    .split("|")
    .map((bar) => bar.trim())
    .filter((bar) => bar.length > 0);

  if (bars.length === 0) throw new Error(`Rejilla vacía: "${spec}"`);

  return bars.map((bar, i) => {
    if (bar === "%") {
      if (i === 0) throw new Error(`El primer compás no puede ser "%" (en "${spec}")`);
      return { chords: [] };
    }
    return { chords: bar.split(/\s+/).filter(Boolean) };
  });
}

/** Todos los cifrados de la rejilla, sin repetir, para poder validarlos. */
export function gridChords(bars: readonly GridBar[]): string[] {
  return [...new Set(bars.flatMap((bar) => bar.chords))];
}

/** Lanza si algún cifrado de la rejilla no existe. */
export function validateGrid(spec: string): void {
  for (const chord of gridChords(parseGrid(spec))) {
    parseFormulaSpec(chord, "chord");
  }
}
