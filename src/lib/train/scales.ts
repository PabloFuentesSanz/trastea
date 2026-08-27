/**
 * Escalas vistas como entrenamiento: grados y digitaciones.
 *
 * Puro, como el resto de `train/`. La caja no se escribe a mano en ninguna
 * parte: sale de `scaleBox`, que ya sabe repartir las notas por cuerdas, así
 * que arreglar una digitación arregla también el entrenamiento.
 */

import { getScale } from "@/data/scales";
import { getTuning } from "@/data/tunings";
import { boxCount, scaleBox } from "@/lib/music/boxes";
import {
  mod12,
  parseInterval,
  parseNote,
  type IntervalName,
  type NoteName,
} from "@/lib/music/notes";
import { midiAt, type Position } from "./cards";

export interface ScaleDegree {
  interval: IntervalName;
  /** distancia a la raíz, 0-11 */
  semitones: number;
}

/** Los grados de una escala con su distancia a la raíz. */
export function scaleDegrees(scaleId: string): ScaleDegree[] {
  return getScale(scaleId).intervals.map((interval) => ({
    interval,
    semitones: mod12(parseInterval(interval).semitones),
  }));
}

/**
 * Qué grado de la escala suena en esa posición, en semitonos desde la raíz;
 * `null` si esa nota no es de la escala.
 */
export function degreeAt(
  root: NoteName,
  scaleId: string,
  position: Position,
  tuningId = "standard",
): number | null {
  const distancia = mod12(midiAt(position, tuningId) - parseNote(root).pc);
  const grado = scaleDegrees(scaleId).find((d) => d.semitones === distancia);
  return grado ? grado.semitones : null;
}

/** Cómo se dice un grado en voz alta, que es como se piensa al tocar. */
export function degreeLabel(interval: IntervalName): string {
  if (interval === "1") return "Raíz";
  const { degree, alteration } = parseInterval(interval);
  const calidad =
    alteration === 0
      ? PERFECTOS.has(degree)
        ? " justa"
        : " mayor"
      : alteration === -1
        ? PERFECTOS.has(degree)
          ? " disminuida"
          : " menor"
        : alteration === 1
          ? " aumentada"
          : alteration === -2
            ? " doble bemol"
            : " doble aumentada";
  return `${degree}ª${calidad}`;
}

const PERFECTOS = new Set([1, 4, 5, 8, 11, 12]);

/** Las cajas que tiene una escala, numeradas desde 1. */
export function boxesOf(scaleId: string): number[] {
  const scale = getScale(scaleId);
  const parent = scale.boxParent ? getScale(scale.boxParent).intervals : undefined;
  const total = boxCount(scale.intervals, parent);
  return Array.from({ length: total }, (_, i) => i + 1);
}

/** Las posiciones de una caja, en el orden en que se tocan (grave a agudo). */
export function scaleBoxPositions(
  root: NoteName,
  scaleId: string,
  box: number,
  tuningId = "standard",
): Position[] {
  const scale = getScale(scaleId);
  return scaleBox({
    root,
    intervals: scale.intervals,
    parentIntervals: scale.boxParent ? getScale(scale.boxParent).intervals : undefined,
    tuningMidi: getTuning(tuningId).midi,
    box,
  }).map(({ string, fret }) => ({ string, fret }));
}
