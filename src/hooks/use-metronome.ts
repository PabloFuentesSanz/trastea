"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  bpmFromTaps,
  clampBpm,
  DEFAULT_CONFIG,
  type MetronomeConfig,
} from "@/lib/metronome/pattern";
import {
  createMetronomeEngine,
  type MetronomeEngine,
  type ScheduledTick,
} from "@/lib/metronome/engine";

export interface UseMetronome {
  config: MetronomeConfig;
  isRunning: boolean;
  /** último tick sonado (para el pulso visual) */
  lastTick: ScheduledTick | null;
  /** bpm vigente (con auto-incremento aplicado) */
  effectiveBpm: number;
  toggle: () => Promise<void>;
  stop: () => void;
  setBpm: (bpm: number) => void;
  nudgeBpm: (delta: number) => void;
  update: (partial: Partial<MetronomeConfig>) => void;
  toggleAccent: (beat: number) => void;
  tap: () => void;
}

export function useMetronome(initial?: Partial<MetronomeConfig>): UseMetronome {
  const [config, setConfig] = useState<MetronomeConfig>(() => ({
    ...DEFAULT_CONFIG,
    ...initial,
  }));
  const [isRunning, setIsRunning] = useState(false);
  const [lastTick, setLastTick] = useState<ScheduledTick | null>(null);

  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);
  const engineRef = useRef<MetronomeEngine | null>(null);
  const rafRef = useRef(0);
  const tapsRef = useRef<number[]>([]);

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = createMetronomeEngine(() => configRef.current);
    }
    return engineRef.current;
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      engineRef.current?.dispose();
    };
  }, []);

  const startVisualLoop = useCallback(() => {
    const loop = () => {
      const engine = engineRef.current;
      if (!engine || !engine.isRunning()) return;
      const played = engine.drainPlayedTicks();
      if (played.length > 0) setLastTick(played[played.length - 1]);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const stop = useCallback(() => {
    engineRef.current?.stop();
    cancelAnimationFrame(rafRef.current);
    setIsRunning(false);
    setLastTick(null);
  }, []);

  const toggle = useCallback(async () => {
    const engine = getEngine();
    if (engine.isRunning()) {
      stop();
    } else {
      await engine.start();
      setIsRunning(true);
      startVisualLoop();
    }
  }, [getEngine, stop, startVisualLoop]);

  const update = useCallback((partial: Partial<MetronomeConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const setBpm = useCallback(
    (bpm: number) => update({ bpm: clampBpm(bpm) }),
    [update],
  );

  const nudgeBpm = useCallback(
    (delta: number) => setConfig((prev) => ({ ...prev, bpm: clampBpm(prev.bpm + delta) })),
    [],
  );

  const toggleAccent = useCallback((beat: number) => {
    setConfig((prev) => {
      const has = prev.accents.includes(beat);
      const accents = has
        ? prev.accents.filter((b) => b !== beat)
        : [...prev.accents, beat].sort((a, b) => a - b);
      return { ...prev, accents };
    });
  }, []);

  const tap = useCallback(() => {
    const now = performance.now();
    // Descarta la tanda anterior si la pausa fue larga
    if (
      tapsRef.current.length > 0 &&
      now - tapsRef.current[tapsRef.current.length - 1] > 2000
    ) {
      tapsRef.current = [];
    }
    tapsRef.current.push(now);
    const bpm = bpmFromTaps(tapsRef.current);
    if (bpm !== null) setConfig((prev) => ({ ...prev, bpm }));
  }, []);

  const effectiveBpm = useMemo(
    () => (isRunning && lastTick ? lastTick.bpm : config.bpm),
    [isRunning, lastTick, config.bpm],
  );

  return {
    config,
    isRunning,
    lastTick,
    effectiveBpm,
    toggle,
    stop,
    setBpm,
    nudgeBpm,
    update,
    toggleAccent,
    tap,
  };
}
