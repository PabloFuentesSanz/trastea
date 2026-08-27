"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createBackingEngine,
  type BackingEngine,
  type BackingEngineConfig,
} from "@/lib/backing/engine";
import type { BackingNote } from "@/lib/backing/groove";
import { clampBpm } from "@/lib/metronome/pattern";

export interface UsePlayerOptions {
  notes: readonly BackingNote[];
  /** pulsos que dura una vuelta */
  length: number;
  initialBpm?: number;
  beatsPerBar?: number;
  countInBars?: number;
}

export interface UsePlayer {
  isRunning: boolean;
  bpm: number;
  loop: boolean;
  /** pulso en curso, o null durante la claqueta y en parado */
  currentBeat: number | null;
  toggle: () => Promise<void>;
  stop: () => void;
  setBpm: (bpm: number) => void;
  setLoop: (loop: boolean) => void;
}

/**
 * Transporte compartido: play/stop, tempo, bucle y seguimiento visual.
 * Lo usan la rejilla y la tab; qué notas suenan lo decide cada una.
 */
export function usePlayer({
  notes,
  length,
  initialBpm = 80,
  beatsPerBar = 4,
  countInBars = 1,
}: UsePlayerOptions): UsePlayer {
  const [bpm, setBpmState] = useState(initialBpm);
  const [loop, setLoop] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [currentBeat, setCurrentBeat] = useState<number | null>(null);

  const configRef = useRef<BackingEngineConfig>({
    notes,
    length,
    bpm,
    countIn: countInBars,
    beatsPerBar,
    loop,
    volume: 0.8,
  });
  useEffect(() => {
    configRef.current = {
      ...configRef.current,
      notes,
      length,
      bpm,
      beatsPerBar,
      countIn: countInBars,
      loop,
    };
  }, [notes, length, bpm, beatsPerBar, countInBars, loop]);

  const engineRef = useRef<BackingEngine | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      engineRef.current?.dispose();
    };
  }, []);

  const stop = useCallback(() => {
    engineRef.current?.stop();
    cancelAnimationFrame(rafRef.current);
    setIsRunning(false);
    setCurrentBeat(null);
  }, []);

  const follow = useCallback(() => {
    const frame = () => {
      const engine = engineRef.current;
      if (!engine || !engine.isRunning()) {
        setIsRunning(false);
        setCurrentBeat(null);
        return;
      }
      setCurrentBeat(engine.currentBeat());
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
  }, []);

  const toggle = useCallback(async () => {
    if (engineRef.current?.isRunning()) {
      stop();
      return;
    }
    if (!engineRef.current) {
      engineRef.current = createBackingEngine(() => configRef.current);
    }
    await engineRef.current.start();
    setIsRunning(true);
    follow();
  }, [follow, stop]);

  const setBpm = useCallback((next: number) => setBpmState(clampBpm(next)), []);

  return { isRunning, bpm, loop, currentBeat, toggle, stop, setBpm, setLoop };
}
