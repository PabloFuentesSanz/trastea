/**
 * De una frecuencia a "qué cuerda es y cuánto le falta".
 *
 * Puro: la parte musical del afinador, separada tanto del micrófono como del
 * dibujo de la aguja.
 */

import { pcToName, type NoteName } from "@/lib/music/notes";

/** Dentro de esta desviación, la cuerda está afinada. */
export const AFINADA_CENTS = 5;

const A4_MIDI = 69;
const A4_HZ = 440;

export function midiToHz(midi: number): number {
  return A4_HZ * Math.pow(2, (midi - A4_MIDI) / 12);
}

export function hzToMidi(hz: number): number {
  return A4_MIDI + 12 * Math.log2(hz / A4_HZ);
}

/** Desviación de `hz` respecto a `target`, en cents (positivo = alta). */
export function centsBetween(hz: number, target: number): number {
  return 1200 * Math.log2(hz / target);
}

export interface NearestNote {
  midi: number;
  name: NoteName;
  octave: number;
  /** desviación respecto a esa nota, entre -50 y +50 */
  cents: number;
}

/** La nota temperada más cercana y lo que le falta. */
export function nearestNote(hz: number): NearestNote {
  const exacto = hzToMidi(hz);
  const midi = Math.round(exacto);
  return {
    midi,
    name: pcToName(((midi % 12) + 12) % 12, false),
    // MIDI 12 es Do de la octava 0, como en cualquier afinador
    octave: Math.floor(midi / 12) - 1,
    cents: (exacto - midi) * 100,
  };
}

export interface NearestString {
  /** 0 = 6ª (grave) … 5 = 1ª (aguda) */
  index: number;
  cents: number;
}

/**
 * A qué cuerda de esta afinación se parece más lo que suena.
 *
 * Se compara contra la altura exacta de cada cuerda, no contra su clase de
 * altura: en Drop D hay dos Res, y decirle a alguien que su 6ª está una
 * octava alta no ayuda a nadie.
 */
export function nearestString(hz: number, tuningMidi: readonly number[]): NearestString {
  let mejor = 0;
  let mejorCents = Infinity;
  tuningMidi.forEach((midi, index) => {
    const cents = centsBetween(hz, midiToHz(midi));
    if (Math.abs(cents) < Math.abs(mejorCents)) {
      mejor = index;
      mejorCents = cents;
    }
  });
  return { index: mejor, cents: mejorCents };
}

/** Cómo se llama la cuerda en voz alta: el índice 0 es la 6ª. */
export function stringLabel(index: number): string {
  return `${6 - index}ª`;
}
