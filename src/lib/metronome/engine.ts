"use client";

/**
 * Motor de audio del metrónomo: agenda clicks por delante del tiempo real
 * sobre el reloj de WebAudio (lookahead scheduling; nunca setInterval para
 * el sonido). La decisión de qué suena viene de pattern.ts.
 */

import * as Tone from "tone";
import {
  bpmAfterMeasures,
  tickAt,
  tickDuration,
  type MetronomeConfig,
  type TickInfo,
} from "./pattern";

const LOOKAHEAD_S = 0.12;
const SCHEDULER_INTERVAL_MS = 25;

const FREQ: Record<Exclude<TickInfo["kind"], "silent">, number> = {
  accent: 1568,
  beat: 1047,
  sub: 784,
};

const GAIN: Record<Exclude<TickInfo["kind"], "silent">, number> = {
  accent: 0.9,
  beat: 0.6,
  sub: 0.3,
};

export interface ScheduledTick extends TickInfo {
  /** tiempo del reloj de audio en el que suena */
  time: number;
  /** bpm vigente en ese tick (con auto-incremento) */
  bpm: number;
}

export interface MetronomeEngine {
  start(): Promise<void>;
  stop(): void;
  isRunning(): boolean;
  /** Ticks ya sonados desde la última consulta (para el pulso visual). */
  drainPlayedTicks(): ScheduledTick[];
  dispose(): void;
}

export function createMetronomeEngine(getConfig: () => MetronomeConfig): MetronomeEngine {
  let running = false;
  let schedulerId: ReturnType<typeof setInterval> | null = null;
  let nextTickTime = 0;
  let tickIndex = 0;
  let pending: ScheduledTick[] = [];

  function click(time: number, kind: Exclude<TickInfo["kind"], "silent">) {
    const ctx = Tone.getContext().rawContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = FREQ[kind];
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(GAIN[kind], time + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.06);
  }

  function scheduleAhead() {
    if (!running) return;
    const base = getConfig();
    const now = Tone.getContext().rawContext.currentTime;

    while (nextTickTime < now + LOOKAHEAD_S) {
      const info = tickAt(base, tickIndex);
      const bpm = bpmAfterMeasures(base, info.measure);
      const config: MetronomeConfig = { ...base, bpm };

      if (info.kind !== "silent") click(nextTickTime, info.kind);
      pending.push({ ...info, time: nextTickTime, bpm });

      nextTickTime += tickDuration(config);
      tickIndex += 1;
    }
  }

  return {
    async start() {
      if (running) return;
      await Tone.start();
      running = true;
      tickIndex = 0;
      pending = [];
      nextTickTime = Tone.getContext().rawContext.currentTime + 0.08;
      scheduleAhead();
      schedulerId = setInterval(scheduleAhead, SCHEDULER_INTERVAL_MS);
    },
    stop() {
      running = false;
      if (schedulerId !== null) clearInterval(schedulerId);
      schedulerId = null;
      pending = [];
    },
    isRunning() {
      return running;
    },
    drainPlayedTicks() {
      const now = Tone.getContext().rawContext.currentTime;
      const played = pending.filter((t) => t.time <= now);
      pending = pending.filter((t) => t.time > now);
      return played;
    },
    dispose() {
      this.stop();
    },
  };
}
