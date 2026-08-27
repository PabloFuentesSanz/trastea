"use client";

import { useMemo, useState } from "react";
import { backingLength, backingNotes, type BackingStyle } from "@/lib/backing/groove";
import type { GridBar } from "@/lib/music/grid";
import { usePlayer, type UsePlayer } from "./use-player";

export interface UseBackingOptions {
  bars: readonly GridBar[];
  initialBpm?: number;
  initialStyle?: BackingStyle;
  beatsPerBar?: number;
}

export interface UseBacking extends UsePlayer {
  style: BackingStyle;
  setStyle: (style: BackingStyle) => void;
  /** compás sonando ahora, o null durante la claqueta y en parado */
  currentBar: number | null;
}

/** La rejilla tocada: el transporte de usePlayer más el groove del estilo. */
export function useBacking({
  bars,
  initialBpm = 80,
  initialStyle = "recto",
  beatsPerBar = 4,
}: UseBackingOptions): UseBacking {
  const [style, setStyle] = useState<BackingStyle>(initialStyle);

  const notes = useMemo(
    () => backingNotes(bars, { style, beatsPerBar }),
    [bars, style, beatsPerBar],
  );
  const length = useMemo(() => backingLength(bars, { beatsPerBar }), [bars, beatsPerBar]);

  const player = usePlayer({ notes, length, initialBpm, beatsPerBar });

  return {
    ...player,
    style,
    setStyle,
    currentBar:
      player.currentBeat === null ? null : Math.floor(player.currentBeat / beatsPerBar),
  };
}
