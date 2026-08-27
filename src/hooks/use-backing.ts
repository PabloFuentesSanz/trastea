"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createBackingEngine,
  type BackingEngine,
  type BackingEngineConfig,
} from "@/lib/backing/engine";
import { backingLength, backingNotes, type BackingStyle } from "@/lib/backing/groove";
import type { GridBar } from "@/lib/music/grid";
import { clampBpm } from "@/lib/metronome/pattern";

export interface UseBackingOptions {
  bars: readonly GridBar[];
  initialBpm?: number;
  initialStyle?: BackingStyle;
  beatsPerBar?: number;
}

export interface UseBacking {
  isRunning: boolean;
  bpm: number;
  style: BackingStyle;
  loop: boolean;
  /** compás sonando ahora, o null durante la claqueta y en parado */
  currentBar: number | null;
  toggle: () => Promise<void>;
  stop: () => void;
  setBpm: (bpm: number) => void;
  nudgeBpm: (delta: number) => void;
  setStyle: (style: BackingStyle) => void;
  setLoop: (loop: boolean) => void;
}

const COUNT_IN_BARS = 1;

export function useBacking({
  bars,
  initialBpm = 80,
  initialStyle = "recto",
  beatsPerBar = 4,
}: UseBackingOptions): UseBacking {
  const [bpm, setBpmState] = useState(initialBpm);
  const [style, setStyle] = useState<BackingStyle>(initialStyle);
  const [loop, setLoop] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [currentBar, setCurrentBar] = useState<number | null>(null);

  const notes = useMemo(
    () => backingNotes(bars, { style, beatsPerBar }),
    [bars, style, beatsPerBar],
  );
  const length = useMemo(() => backingLength(bars, { beatsPerBar }), [bars, beatsPerBar]);

  const configRef = useRef<BackingEngineConfig>({
    notes,
    length,
    bpm,
    countIn: COUNT_IN_BARS,
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
      loop,
    };
  }, [notes, length, bpm, beatsPerBar, loop]);

  const engineRef = useRef<BackingEngine | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      engineRef.current?.dispose();
    };
  }, []);

  const follow = useCallback(() => {
    const loopFrame = () => {
      const engine = engineRef.current;
      if (!engine || !engine.isRunning()) {
        setIsRunning(false);
        setCurrentBar(null);
        return;
      }
      const beat = engine.currentBeat();
      setCurrentBar(beat === null ? null : Math.floor(beat / beatsPerBar));
      rafRef.current = requestAnimationFrame(loopFrame);
    };
    rafRef.current = requestAnimationFrame(loopFrame);
  }, [beatsPerBar]);

  const stop = useCallback(() => {
    engineRef.current?.stop();
    cancelAnimationFrame(rafRef.current);
    setIsRunning(false);
    setCurrentBar(null);
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
  const nudgeBpm = useCallback(
    (delta: number) => setBpmState((prev) => clampBpm(prev + delta)),
    [],
  );

  return {
    isRunning,
    bpm,
    style,
    loop,
    currentBar,
    toggle,
    stop,
    setBpm,
    nudgeBpm,
    setStyle,
    setLoop,
  };
}
