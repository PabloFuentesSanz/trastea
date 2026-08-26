"use client";

import { createContext, useContext } from "react";

export interface LessonPlayerState {
  doneBlocks: ReadonlySet<string>;
  bpmByBlock: Readonly<Record<string, number>>;
  completed: boolean;
  demo: boolean;
  markBlockDone: (blockId: string, bpm?: number) => void;
  setBpm: (blockId: string, bpm: number) => void;
}

export const LessonPlayerContext = createContext<LessonPlayerState | null>(null);

export function useLessonPlayer(): LessonPlayerState {
  const ctx = useContext(LessonPlayerContext);
  if (!ctx) throw new Error("useLessonPlayer fuera de <LessonPlayer>");
  return ctx;
}
