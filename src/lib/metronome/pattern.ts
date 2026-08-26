/**
 * Lógica pura del metrónomo: qué tick suena, cuándo y cómo.
 * El motor de audio (engine.ts) solo agenda lo que esta capa decide.
 */

export type Bpm = number & { readonly __brand?: "Bpm" };

export const MIN_BPM = 20;
export const MAX_BPM = 300;

export type TickKind = "accent" | "beat" | "sub" | "silent";

export interface TimeSignature {
  /** pulsos por compás */
  beats: number;
  /** figura del pulso: 4 = negra, 8 = corchea */
  unit: 4 | 8;
}

export interface AutoIncrement {
  enabled: boolean;
  /** bpm que se suman */
  addBpm: number;
  /** cada cuántos compases */
  everyMeasures: number;
  /** tope */
  maxBpm: number;
}

export interface MetronomeConfig {
  bpm: Bpm;
  signature: TimeSignature;
  /** subdivisiones por pulso: 1 = pulso, 2 = corcheas, 3 = tresillos, 4 = semis */
  subdivision: 1 | 2 | 3 | 4;
  /** pulsos acentuados (0-based). Por defecto [0]. */
  accents: readonly number[];
  /** modo jazz: solo suenan los pulsos 2 y 4 (en compás de 4) */
  only24: boolean;
  autoIncrement: AutoIncrement;
}

export const DEFAULT_CONFIG: MetronomeConfig = {
  bpm: 80,
  signature: { beats: 4, unit: 4 },
  subdivision: 1,
  accents: [0],
  only24: false,
  autoIncrement: { enabled: false, addBpm: 4, everyMeasures: 4, maxBpm: 180 },
};

export function clampBpm(bpm: number): Bpm {
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)));
}

/** Duración de un tick (una subdivisión) en segundos. */
export function tickDuration(config: MetronomeConfig): number {
  const beatSeconds = 60 / config.bpm / (config.signature.unit / 4);
  return beatSeconds / config.subdivision;
}

export function ticksPerMeasure(config: MetronomeConfig): number {
  return config.signature.beats * config.subdivision;
}

export interface TickInfo {
  /** compás 0-based desde el inicio */
  measure: number;
  /** pulso 0-based dentro del compás */
  beat: number;
  /** subdivisión 0-based dentro del pulso */
  sub: number;
  kind: TickKind;
}

/** Clasifica el tick `index` (0-based global) según la configuración. */
export function tickAt(config: MetronomeConfig, index: number): TickInfo {
  const perMeasure = ticksPerMeasure(config);
  const measure = Math.floor(index / perMeasure);
  const inMeasure = index % perMeasure;
  const beat = Math.floor(inMeasure / config.subdivision);
  const sub = inMeasure % config.subdivision;

  let kind: TickKind;
  if (config.only24) {
    // Solo 2 y 4 (0-based: pulsos 1 y 3), y solo la cabeza del pulso.
    kind = sub === 0 && beat % 2 === 1 ? "beat" : "silent";
  } else if (sub !== 0) {
    kind = "sub";
  } else if (config.accents.includes(beat)) {
    kind = "accent";
  } else {
    kind = "beat";
  }

  return { measure, beat, sub, kind };
}

/** Bpm vigente tras `measuresCompleted` compases con auto-incremento. */
export function bpmAfterMeasures(
  config: MetronomeConfig,
  measuresCompleted: number,
): Bpm {
  const { autoIncrement } = config;
  if (!autoIncrement.enabled || autoIncrement.everyMeasures <= 0) return config.bpm;
  const steps = Math.floor(measuresCompleted / autoIncrement.everyMeasures);
  const raw = config.bpm + steps * autoIncrement.addBpm;
  return clampBpm(Math.min(raw, autoIncrement.maxBpm));
}

/**
 * Tap tempo: bpm a partir de los instantes (ms) de los últimos taps.
 * Usa como máximo los 5 últimos intervalos y descarta pausas largas (>2s).
 */
export function bpmFromTaps(tapTimesMs: readonly number[]): Bpm | null {
  if (tapTimesMs.length < 2) return null;
  const recent = tapTimesMs.slice(-6);
  const intervals: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    const delta = recent[i] - recent[i - 1];
    if (delta > 0 && delta < 2000) intervals.push(delta);
  }
  if (intervals.length === 0) return null;
  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  return clampBpm(60000 / avg);
}
