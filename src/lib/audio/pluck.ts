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
import { impulseResponse, panPorAltura, variacionDeAtaque } from "./room";

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
 * La sala. Una guitarra grabada en cámara anecoica suena a sintetizador
 * aunque el modelo de cuerda sea perfecto: el oído espera reflexiones. Se
 * genera la respuesta al impulso (0 kB de descarga) y se comparte entre todos
 * los instrumentos: la sala es una, los instrumentos son varios.
 */
let sala: { entrada: GainNode; wet: GainNode } | null = null;

/** Cuánta sala se oye. Poca: esto acompaña, no es un efecto. */
const WET = 0.22;
/** Segundos de cola de la sala y curva de caída. */
const SALA_S = 1.5;
const SALA_DECAY = 2.6;

/** La entrada de la sala, para lo que no es una cuerda pulsada. */
export function salaEntrada(): GainNode {
  return salaDe(audioContext());
}

function salaDe(ctx: AudioContext): GainNode {
  if (sala) return sala.entrada;

  const entrada = ctx.createGain();
  const seco = ctx.createGain();
  const wet = ctx.createGain();
  seco.gain.value = 1;
  wet.gain.value = WET;

  const convolver = ctx.createConvolver();
  const ir = ctx.createBuffer(2, Math.round(ctx.sampleRate * SALA_S), ctx.sampleRate);
  const canales = impulseResponse(ctx.sampleRate, SALA_S, SALA_DECAY);
  ir.copyToChannel(canales[0], 0);
  ir.copyToChannel(canales[1], 1);
  convolver.buffer = ir;

  // un limitador suave al final: con cinco cuerdas sonando a la vez más la
  // cola de la sala, los picos se iban al techo y eso distorsiona. De paso
  // pega el conjunto, que es la mitad de lo que hace sonar "grabado".
  const maestro = ctx.createDynamicsCompressor();
  maestro.threshold.value = -8;
  maestro.knee.value = 12;
  maestro.ratio.value = 4;
  maestro.attack.value = 0.004;
  maestro.release.value = 0.25;
  maestro.connect(ctx.destination);

  entrada.connect(seco).connect(maestro);
  entrada.connect(convolver).connect(wet).connect(maestro);

  sala = { entrada, wet };
  return entrada;
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
  nodo.connect(salaDe(ctx));

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

  // que dos pulsaciones de la misma nota no sean la misma onda: el buffer
  // está cacheado, así que la diferencia se mete al reproducirlo
  const v = variacionDeAtaque();
  source.detune.value = v.cents;
  const cuando = time + v.retraso;

  const gain = ctx.createGain();
  const volumen = gainValue * v.ganancia;
  gain.gain.setValueAtTime(volumen, cuando);
  const release = Math.max(duration, 0.1);
  gain.gain.setValueAtTime(volumen, cuando + release);
  gain.gain.exponentialRampToValueAtTime(0.0001, cuando + release + 0.09);

  // las graves al centro, las agudas abiertas: el sonido deja de salir de un
  // punto en mitad de la cabeza
  const panner = ctx.createStereoPanner();
  panner.pan.value = panPorAltura(midi);

  source.connect(gain).connect(panner).connect(bodyFor(ctx, instrumentId));
  source.start(cuando);
  source.stop(cuando + release + 0.15);
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
