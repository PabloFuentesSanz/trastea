/**
 * Los timbres con los que suena Trastea.
 *
 * Todos salen del mismo modelo de cuerda (Karplus-Strong) cambiando tres
 * cosas: **con qué se ataca**, **cuánto brillo conserva** y **cuánto dura**.
 * Encima va la **caja de resonancia**, que es la que de verdad separa "cuerda
 * sintética" de "guitarra": una acústica tiene picos marcados hacia 100 y 215
 * Hz, y sin ellos se oye la cuerda desnuda.
 *
 * Cero samples y cero dependencias: son parámetros y dos filtros.
 */

import type { Excitation } from "@/lib/backing/string-synth";

/** Una resonancia de la caja: frecuencia, estrechez y cuánto realza. */
export interface BodyResonance {
  freq: number;
  q: number;
  /** dB */
  gain: number;
}

export interface InstrumentDef {
  id: string;
  name: string;
  /** una línea que lo distinga en el selector */
  summary: string;
  excitation: Excitation;
  /** 0-1: cuánto agudo conserva la cuerda en cada vuelta */
  brightness: number;
  /** multiplica la cola respecto a la cuerda base */
  decayScale: number;
  /** rigidez; solo tiene sentido en cuerdas golpeadas */
  inharmonicity?: number;
  /** picos de la caja; vacío en la eléctrica, que no tiene caja */
  body: readonly BodyResonance[];
  /** transposición en semitonos, para el bajo */
  transpose?: number;
  /** ajuste de volumen para que todos suenen igual de fuertes */
  gain: number;
}

export const INSTRUMENTS: Record<string, InstrumentDef> = {
  nylon: {
    id: "nylon",
    name: "Guitarra clásica",
    summary: "Nylon y yema: redonda, cálida, sin filo en el ataque",
    excitation: "dedo",
    brightness: 0.18,
    decayScale: 0.85,
    // caja de clásica: Helmholtz algo más grave y menos realce que la de acero
    body: [
      { freq: 96, q: 4, gain: 7 },
      { freq: 205, q: 5, gain: 4.5 },
      { freq: 430, q: 3, gain: 2.5 },
    ],
    gain: 1.05,
  },

  acustica: {
    id: "acustica",
    name: "Acústica de acero",
    summary: "Púa y caja grande: brillante y con cuerpo",
    excitation: "pua",
    brightness: 0.42,
    decayScale: 1.15,
    body: [
      { freq: 104, q: 4.5, gain: 9 },
      { freq: 215, q: 5, gain: 6 },
      { freq: 400, q: 2.5, gain: 3 },
      { freq: 2600, q: 1.2, gain: 2.5 },
    ],
    gain: 0.95,
  },

  electrica: {
    id: "electrica",
    name: "Eléctrica limpia",
    summary: "Sin caja: fundamental clara y mucho sustain",
    excitation: "pua",
    brightness: 0.34,
    decayScale: 1.5,
    // una eléctrica maciza no tiene caja; lo que colorea es la pastilla
    body: [{ freq: 1900, q: 0.9, gain: 3 }],
    gain: 1,
  },

  bajo: {
    id: "bajo",
    name: "Bajo",
    summary: "Una octava abajo, oscuro y largo",
    excitation: "dedo",
    brightness: 0.1,
    decayScale: 1.8,
    body: [{ freq: 70, q: 2.5, gain: 6 }],
    transpose: -12,
    gain: 1.15,
  },

  piano: {
    id: "piano",
    name: "Piano eléctrico",
    summary: "Cuerda golpeada, no pulsada: ataque blando y timbre de campana",
    excitation: "martillo",
    brightness: 0.55,
    decayScale: 2.2,
    // la rigidez de la cuerda golpeada: sube los armónicos y da el punto metálico
    inharmonicity: 0.008,
    body: [
      { freq: 320, q: 1.5, gain: 3 },
      { freq: 1400, q: 1, gain: 3.5 },
    ],
    gain: 0.9,
  },
};

export const INSTRUMENT_IDS: readonly string[] = Object.keys(INSTRUMENTS);

export const DEFAULT_INSTRUMENT = "acustica";

export function isInstrumentId(id: string): boolean {
  return id in INSTRUMENTS;
}

/** El instrumento pedido, o la eléctrica si el id no existe. */
export function getInstrument(id: string | undefined): InstrumentDef {
  return (id && INSTRUMENTS[id]) || INSTRUMENTS.electrica;
}
