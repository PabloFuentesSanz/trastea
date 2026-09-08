/**
 * Patrones de rasgueo: la mano derecha escrita.
 *
 * Un patrón son ocho corcheas de un compás de 4/4. En cada una la mano baja
 * (pulso) o sube ("y"), y tú decides si toca las cuerdas (↓ ↑), pasa de
 * largo (·) o las apaga (x). Lo importante es que la mano no se para nunca:
 * por eso el hueco existe como símbolo y no como ausencia.
 *
 *   "↓ · ↓↑ · ↑ ↓↑"   el patrón de media discografía pop
 *   "D - D U - U D U" lo mismo, con letras
 *   "↓ x ↓ x"          negras con apagado en 2 y 4
 *
 * Lógica pura, como groove.ts: aquí se decide qué suena, no cuándo.
 */

import { ordenDeRasgueo, type BackingNote } from "./groove";
import { parseFormulaSpec } from "@/lib/music/spec";
import { generateVoicings } from "@/lib/music/voicings";
import { getTuning } from "@/data/tunings";

export type StrumDirection = "abajo" | "arriba" | "apagado";

export interface StrumHit {
  /** posición dentro del compás en pulsos: 0, 0.5, 1 … 3.5 */
  beat: number;
  direction: StrumDirection;
}

const CORCHEAS = 8;

const SIMBOLOS: Record<string, StrumDirection | "hueco"> = {
  "↓": "abajo",
  d: "abajo",
  "↑": "arriba",
  u: "arriba",
  x: "apagado",
  "·": "hueco",
  "-": "hueco",
  ".": "hueco",
};

/**
 * Cada casilla del patrón es una corchea. Una casilla con dos símbolos
 * ("↓↑") son dos corcheas: la del pulso y la del "y". Así "↓ · ↓↑ · ↑ ↓↑"
 * cabe en seis casillas y sigue siendo un compás entero.
 */
export function parseStrumPattern(patron: string): StrumHit[] {
  const casillas = patron.trim().split(/\s+/).filter(Boolean);
  const hits: StrumHit[] = [];
  let corchea = 0;

  for (const casilla of casillas) {
    const simbolos = [...casilla.toLowerCase()];
    if (simbolos.length > 2) {
      throw new Error(`"${casilla}": una casilla es una corchea o dos, no más`);
    }
    for (const simbolo of simbolos) {
      const direccion = SIMBOLOS[simbolo];
      if (direccion === undefined) {
        throw new Error(`"${simbolo}": los golpes se escriben con ↓ ↑ x · (o D U x -)`);
      }
      if (corchea >= CORCHEAS) {
        throw new Error(`"${patron}": un patrón son ocho corcheas, y hay más`);
      }
      const enPulso = corchea % 2 === 0;
      if (direccion === "abajo" && !enPulso && simbolos.length === 2) {
        throw new Error(
          `"${casilla}": en el "y" la mano sube; abajo-arriba se escribe ↓↑`,
        );
      }
      if (direccion === "arriba" && enPulso && simbolos.length === 2) {
        throw new Error(
          `"${casilla}": en el pulso la mano baja; abajo-arriba se escribe ↓↑`,
        );
      }
      if (direccion !== "hueco") hits.push({ beat: corchea / 2, direction: direccion });
      corchea += 1;
    }
  }

  if (corchea !== CORCHEAS) {
    throw new Error(`"${patron}": un patrón son ocho corcheas, y hay ${corchea}`);
  }
  return hits;
}

/** "1 abajo, 2 abajo, y arriba…": el patrón como se cuenta en voz alta. */
export function strumPatternLabel(patron: string): string {
  return parseStrumPattern(patron)
    .map((hit) => {
      const pulso = Number.isInteger(hit.beat) ? String(hit.beat + 1) : "y";
      return `${pulso} ${hit.direction}`;
    })
    .join(", ");
}

const STANDARD = getTuning("standard").midi;

/** La digitación abierta más grave del acorde: lo que rasguea una mano que empieza. */
function midisDe(chord: string): number[] {
  const spec = parseFormulaSpec(chord, "chord");
  const candidatas = generateVoicings({
    root: spec.root,
    intervals: spec.intervals,
    tuningMidi: STANDARD,
    minStrings: 4,
    maxStrings: 6,
    maxSpan: 3,
    maxBaseFret: 3,
  });
  const mejor = [...candidatas].sort((a, b) => b.soundingStrings - a.soundingStrings)[0];
  return mejor ? mejor.midis : spec.intervals.map((_, i) => 52 + i * 4);
}

const VELOCIDAD: Record<StrumDirection, number> = {
  abajo: 0.8,
  arriba: 0.55,
  apagado: 0.5,
};

/**
 * Las notas de tocar el patrón sobre una lista de acordes, un compás por
 * acorde (o `bars` compases del único acorde), listas para el motor.
 */
export function strumNotes(
  patron: string,
  chords: readonly string[],
  options: { bars?: number } = {},
): BackingNote[] {
  const hits = parseStrumPattern(patron);
  const compases =
    chords.length > 1 ? chords.map((c) => c) : Array(options.bars ?? 1).fill(chords[0]);
  const notes: BackingNote[] = [];

  compases.forEach((chord: string, bar: number) => {
    const midis = midisDe(chord);
    const inicio = bar * 4;
    hits.forEach((hit, i) => {
      const siguiente = hits[i + 1]?.beat ?? 4;
      const duracion = Math.max(0.25, siguiente - hit.beat);
      if (hit.direction === "apagado") {
        notes.push({
          beat: inicio + hit.beat,
          duration: 0.25,
          midi: 0,
          velocity: VELOCIDAD.apagado,
          voice: "muerta",
        });
        return;
      }
      const orden = ordenDeRasgueo(midis, hit.direction === "abajo");
      for (const midi of midis) {
        notes.push({
          beat: inicio + hit.beat,
          duration: duracion,
          midi,
          velocity: VELOCIDAD[hit.direction],
          voice: "acorde",
          strumIndex: orden.get(midi),
        });
      }
    });
  });
  return notes;
}
