"use client";

import { useCallback } from "react";
import { useMetronome } from "@/hooks/use-metronome";
import type { MetronomeConfig } from "@/lib/metronome/pattern";
import { paramsFromConfig } from "@/lib/metronome/url";
import { MetronomePanel } from "./metronome-panel";

export function MetronomePageClient({ initial }: { initial: MetronomeConfig }) {
  const metronome = useMetronome(initial);

  // El estado de la herramienta vive en la URL: cualquier lección puede
  // enlazar esta configuración exacta.
  const syncUrl = useCallback((config: MetronomeConfig) => {
    const params = paramsFromConfig(config);
    window.history.replaceState(null, "", `/metronomo?${params.toString()}`);
  }, []);

  return (
    <MetronomePanel metronome={metronome} globalShortcuts onConfigChange={syncUrl} />
  );
}
