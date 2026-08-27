"use client";

/**
 * La cuerda pulsada de Trastea: síntesis Karplus-Strong renderizada a un
 * buffer y cacheada por altura. Sintetizar cuesta, pero solo la primera vez
 * que suena esa nota; a partir de ahí es reproducir un buffer.
 *
 * Vive aquí y no dentro del motor de bases porque lo usan los dos: las bases
 * y los ejercicios de oído. Un solo timbre en toda la app.
 */

import { midiToFrequency } from "@/lib/music/fretboard";
import { pluckSamples } from "@/lib/backing/string-synth";
import { audioContext, audioNow, resumeAudio } from "./context";

/** Cuánto se sintetiza de cada cuerda; lo que suene menos, se corta antes. */
export const TAIL_S = 2.4;

const strings = new Map<number, AudioBuffer>();

export function stringBuffer(ctx: BaseAudioContext, midi: number): AudioBuffer {
  const cached = strings.get(midi);
  if (cached) return cached;

  const samples = pluckSamples(ctx.sampleRate, midiToFrequency(midi), TAIL_S, {
    seed: 1000 + midi,
  });
  const buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
  buffer.copyToChannel(samples, 0);
  strings.set(midi, buffer);
  return buffer;
}

/**
 * Una nota pulsada en un momento del reloj de audio. Al soltar no se corta en
 * seco —eso chasquea— sino que se deja caer en unos milisegundos.
 */
export function pluckAt(
  time: number,
  midi: number,
  duration: number,
  gainValue: number,
): void {
  const ctx = audioContext();
  const source = ctx.createBufferSource();
  source.buffer = stringBuffer(ctx, midi);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainValue, time);
  const release = Math.max(duration, 0.1);
  gain.gain.setValueAtTime(gainValue, time + release);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + release + 0.09);

  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(time);
  source.stop(time + release + 0.15);
}

/** Deja los buffers listos para que la primera nota no llegue tarde. */
export function warmPluck(midis: Iterable<number>): void {
  const ctx = audioContext();
  for (const midi of midis) stringBuffer(ctx, midi);
}

export interface PlayNotesOptions {
  /** segundos entre ataques; 0 = todas a la vez (acorde) */
  gap?: number;
  /** cuánto suena cada nota */
  duration?: number;
  gain?: number;
  /** rasgueo: separa un pelín las notas de un acorde, como una púa de verdad */
  strum?: number;
}

/**
 * Toca una serie de alturas. Devuelve cuánto dura en segundos, para que quien
 * llama sepa cuándo volver a habilitar el botón.
 */
export async function playNotes(
  midis: readonly number[],
  { gap = 0, duration = 1.1, gain = 0.5, strum = 0 }: PlayNotesOptions = {},
): Promise<number> {
  if (midis.length === 0) return 0;
  await resumeAudio();
  warmPluck(midis);

  const start = audioNow() + 0.06;
  midis.forEach((midi, i) => {
    pluckAt(start + i * gap + i * strum, midi, duration, gain);
  });
  return (midis.length - 1) * (gap + strum) + duration;
}
