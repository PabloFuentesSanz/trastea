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
import { DEFAULT_INSTRUMENT, getInstrument } from "@/data/instruments";
import { audioContext, audioNow, resumeAudio } from "./context";

/** Cuánto se sintetiza de cada cuerda; lo que suene menos, se corta antes. */
export const TAIL_S = 2.4;

/**
 * El instrumento con el que suena todo. Es estado global de verdad —lo leen
 * el motor de bases, las tabs del curso y los ejercicios de oído—, así que se
 * expone como un store observable en vez de como una variable suelta: así la
 * UI se entera de los cambios sin pasarlo por props por media aplicación.
 */
let current = DEFAULT_INSTRUMENT;
const listeners = new Set<() => void>();

export function setInstrument(id: string): void {
  if (id === current) return;
  current = id;
  for (const l of listeners) l();
}

export function currentInstrument(): string {
  return current;
}

export function subscribeInstrument(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** En el servidor siempre el de por defecto: allí no hay nada guardado. */
export function serverInstrument(): string {
  return DEFAULT_INSTRUMENT;
}

// cacheadas por (instrumento, altura): la misma nota en dos instrumentos no
// es la misma muestra
const strings = new Map<string, AudioBuffer>();

export function stringBuffer(
  ctx: BaseAudioContext,
  midi: number,
  instrumentId = current,
): AudioBuffer {
  const clave = `${instrumentId}:${midi}`;
  const cached = strings.get(clave);
  if (cached) return cached;

  const inst = getInstrument(instrumentId);
  const sonante = midi + (inst.transpose ?? 0);
  const samples = pluckSamples(ctx.sampleRate, midiToFrequency(sonante), TAIL_S, {
    brightness: inst.brightness,
    excitation: inst.excitation,
    decayScale: inst.decayScale,
    inharmonicity: inst.inharmonicity,
    seed: 1000 + midi,
  });
  const buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
  buffer.copyToChannel(samples, 0);
  strings.set(clave, buffer);
  return buffer;
}

/**
 * La caja de resonancia: unos pocos picos que realzan las frecuencias donde
 * la madera vibra. Es lo que hace que una cuerda suene a instrumento y no a
 * cuerda. Se monta una vez por instrumento y la comparten todas las notas.
 */
const bodies = new Map<string, AudioNode>();

function bodyFor(ctx: AudioContext, instrumentId: string): AudioNode {
  const cached = bodies.get(instrumentId);
  if (cached) return cached;

  const inst = getInstrument(instrumentId);
  const entrada = ctx.createGain();
  entrada.gain.value = inst.gain;

  let nodo: AudioNode = entrada;
  for (const res of inst.body) {
    const filtro = ctx.createBiquadFilter();
    filtro.type = "peaking";
    filtro.frequency.value = res.freq;
    filtro.Q.value = res.q;
    filtro.gain.value = res.gain;
    nodo.connect(filtro);
    nodo = filtro;
  }
  nodo.connect(ctx.destination);

  bodies.set(instrumentId, entrada);
  return entrada;
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
  instrumentId = current,
): void {
  const ctx = audioContext();
  const source = ctx.createBufferSource();
  source.buffer = stringBuffer(ctx, midi, instrumentId);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainValue, time);
  const release = Math.max(duration, 0.1);
  gain.gain.setValueAtTime(gainValue, time + release);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + release + 0.09);

  source.connect(gain);
  gain.connect(bodyFor(ctx, instrumentId));
  source.start(time);
  source.stop(time + release + 0.15);
}

/** Deja los buffers listos para que la primera nota no llegue tarde. */
export function warmPluck(midis: Iterable<number>, instrumentId = current): void {
  const ctx = audioContext();
  for (const midi of midis) stringBuffer(ctx, midi, instrumentId);
}

export interface PlayNotesOptions {
  /** segundos entre ataques; 0 = todas a la vez (acorde) */
  gap?: number;
  /** cuánto suena cada nota */
  duration?: number;
  gain?: number;
  /** rasgueo: separa un pelín las notas de un acorde, como una púa de verdad */
  strum?: number;
  /** con qué instrumento; por defecto, el que esté puesto */
  instrument?: string;
}

/**
 * Toca una serie de alturas. Devuelve cuánto dura en segundos, para que quien
 * llama sepa cuándo volver a habilitar el botón.
 */
export async function playNotes(
  midis: readonly number[],
  {
    gap = 0,
    duration = 1.1,
    gain = 0.5,
    strum = 0,
    instrument = current,
  }: PlayNotesOptions = {},
): Promise<number> {
  if (midis.length === 0) return 0;
  await resumeAudio();
  warmPluck(midis, instrument);

  const start = audioNow() + 0.06;
  midis.forEach((midi, i) => {
    pluckAt(start + i * gap + i * strum, midi, duration, gain, instrument);
  });
  return (midis.length - 1) * (gap + strum) + duration;
}
