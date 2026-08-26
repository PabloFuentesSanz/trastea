"use client";

import { useMetronome } from "@/hooks/use-metronome";
import { MetronomePanel } from "@/components/metronome/metronome-panel";
import { configFromParams } from "@/lib/metronome/url";
import type { MetronomeConfig } from "@/lib/metronome/pattern";
import type { LessonBlock } from "@/lib/content/schemas";

/** Config del metrónomo embebido de un bloque (tool /metronomo o bpm_start). */
export function metronomeConfigForBlock(block: LessonBlock): MetronomeConfig | null {
  if (block.tool?.startsWith("/metronomo")) {
    const query = block.tool.split("?")[1] ?? "";
    return configFromParams(Object.fromEntries(new URLSearchParams(query)));
  }
  if (block.bpm_start) {
    return configFromParams({ bpm: String(block.bpm_start) });
  }
  return null;
}

export function EmbeddedMetronome({ initial }: { initial: MetronomeConfig }) {
  const metronome = useMetronome(initial);
  return (
    <div className="rounded-lg border bg-background/40">
      <MetronomePanel metronome={metronome} embedded />
    </div>
  );
}
