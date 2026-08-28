"use client";

/**
 * Motor de la base de acompañamiento: agenda por delante del reloj de
 * WebAudio las notas que decide groove.ts (puro). Mismo reparto que en el
 * metrónomo — aquí no se decide qué suena, solo cuándo y con qué timbre.
 */

import type { BackingNote } from "./groove";
import { audioContext, audioNow, resumeAudio } from "@/lib/audio/context";
import { pluckAt, salaEntrada, stringBuffer } from "@/lib/audio/pluck";

const LOOKAHEAD_S = 0.15;
const SCHEDULER_INTERVAL_MS = 25;
/** margen antes del primer sonido, para no llegar tarde al arranque */
const START_PADDING_S = 0.12;

/** Cuánto pesa cada voz en la mezcla. */
const VOICE_GAIN: Record<string, number> = {
  bajo: 0.5,
  acorde: 0.22,
  melodia: 0.42,
  muerta: 0.3,
};

export interface BackingEngineConfig {
  notes: readonly BackingNote[];
  /** pulsos que dura una vuelta */
  length: number;
  bpm: number;
  /** compases de claqueta antes de la primera vuelta */
  countIn: number;
  beatsPerBar: number;
  loop: boolean;
  volume: number;
  /** se llama al empezar cada vuelta después de la primera */
  onCycle?: () => void;
}

export interface BackingEngine {
  start(): Promise<void>;
  stop(): void;
  isRunning(): boolean;
  /** pulso en curso, o null si aún está la claqueta (para el resalte visual) */
  currentBeat(): number | null;
  dispose(): void;
}

/** Lo que tarda la púa en pasar de una cuerda a la siguiente. */
const RASGUEO_S = 0.011;

/** Golpe seco sin altura: la cuerda apagada del funk y de los ghost notes. */
function deadNote(time: number, duration: number, gainValue: number) {
  const ctx = audioContext();
  const noise = ctx.createBufferSource();
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.06), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 320;
  filter.Q.value = 1.2;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainValue, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + Math.max(duration, 0.05));

  // la cuerda apagada es música, así que pasa por la misma sala que el resto
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(salaEntrada());
  noise.start(time);
  noise.stop(time + 0.08);
}

/** Claqueta: el mismo click seco del metrónomo. */
function click(time: number, accent: boolean, gainValue: number) {
  const ctx = audioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = accent ? 1568 : 1047;
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(gainValue * 0.5, time + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.06);
}

export function createBackingEngine(getConfig: () => BackingEngineConfig): BackingEngine {
  let running = false;
  let schedulerId: ReturnType<typeof setInterval> | null = null;
  /** tiempo de audio del pulso 0 de la vuelta actual */
  let cycleStart = 0;
  /** pulso ya agendado (relativo a la vuelta) */
  let cursor = 0;
  let countInLeft = 0;

  function scheduleAhead() {
    if (!running) return;
    const config = getConfig();
    const secondsPerBeat = 60 / config.bpm;
    const now = audioNow();
    const horizon = now + LOOKAHEAD_S;

    // claqueta: un click por pulso antes de que empiece la base
    while (countInLeft > 0) {
      const time = cycleStart - countInLeft * secondsPerBeat;
      if (time >= horizon) return;
      const restantes = countInLeft - 1;
      click(
        time,
        restantes % config.beatsPerBar === config.beatsPerBar - 1,
        config.volume,
      );
      countInLeft -= 1;
    }

    while (cycleStart + cursor * secondsPerBeat < horizon) {
      const desde = cursor;
      // se agenda pulso a pulso: así un cambio de bpm entra en la vuelta
      const hasta = desde + 1;
      for (const note of config.notes) {
        if (note.beat < desde || note.beat >= hasta) continue;
        // el rasgueo: cada cuerda entra unos milisegundos después de la
        // anterior. Seis notas exactamente a la vez suenan a teclado, no a
        // púa bajando por las cuerdas
        const time =
          cycleStart + note.beat * secondsPerBeat + (note.strumIndex ?? 0) * RASGUEO_S;
        const seconds = note.duration * secondsPerBeat;
        const gain = note.velocity * config.volume * (VOICE_GAIN[note.voice] ?? 0.3);
        if (note.voice === "muerta") deadNote(time, seconds, gain);
        else pluckAt(time, note.midi, seconds, gain);
      }
      cursor = hasta;

      if (cursor >= config.length) {
        if (!config.loop) {
          // deja sonar la última nota y para
          const fin = cycleStart + config.length * secondsPerBeat;
          setTimeout(
            () => {
              if (audioNow() >= fin - 0.05) stop();
            },
            Math.max((fin - now) * 1000, 0),
          );
          return;
        }
        cycleStart += config.length * secondsPerBeat;
        cursor = 0;
        config.onCycle?.();
      }
    }
  }

  function stop() {
    running = false;
    if (schedulerId !== null) clearInterval(schedulerId);
    schedulerId = null;
    countInLeft = 0;
  }

  return {
    async start() {
      if (running) return;
      const config = getConfig();
      await resumeAudio();
      // se sintetizan de golpe las cuerdas que van a sonar: hacerlo dentro
      // del bucle metería un tirón la primera vez que aparece cada nota
      const ctx = audioContext();
      for (const midi of new Set(
        config.notes.filter((n) => n.voice !== "muerta").map((n) => n.midi),
      )) {
        stringBuffer(ctx, midi);
      }
      running = true;
      cursor = 0;
      countInLeft = config.countIn * config.beatsPerBar;
      const now = audioNow();
      cycleStart = now + START_PADDING_S + (countInLeft * 60) / config.bpm;
      scheduleAhead();
      schedulerId = setInterval(scheduleAhead, SCHEDULER_INTERVAL_MS);
    },
    stop,
    isRunning() {
      return running;
    },
    currentBeat() {
      if (!running) return null;
      const config = getConfig();
      const now = audioNow();
      if (now < cycleStart) return null;
      const beat = (now - cycleStart) / (60 / config.bpm);
      return config.loop ? beat % config.length : Math.min(beat, config.length);
    },
    dispose() {
      stop();
    },
  };
}
