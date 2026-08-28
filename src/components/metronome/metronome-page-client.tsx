"use client";

import { useCallback } from "react";
import { useMetronome } from "@/hooks/use-metronome";
import type { MetronomeConfig } from "@/lib/metronome/pattern";
import { paramsFromConfig } from "@/lib/metronome/url";
import { MetronomePanel } from "./metronome-panel";
import { BpmQuickLog, type EjercicioParaMarcar } from "./bpm-quick-log";

export function MetronomePageClient({
  initial,
  ejercicios,
  ejercicioInicial,
  demo,
}: {
  initial: MetronomeConfig;
  ejercicios: EjercicioParaMarcar[];
  ejercicioInicial?: string;
  demo: boolean;
}) {
  const metronome = useMetronome(initial);

  // El estado de la herramienta vive en la URL: cualquier lección puede
  // enlazar esta configuración exacta.
  const syncUrl = useCallback((config: MetronomeConfig) => {
    const params = paramsFromConfig(config);
    window.history.replaceState(null, "", `/metronomo?${params.toString()}`);
  }, []);

  return (
    <>
      <MetronomePanel metronome={metronome} globalShortcuts onConfigChange={syncUrl} />
      <BpmQuickLog
        ejercicios={ejercicios}
        inicial={ejercicioInicial}
        bpm={metronome.config.bpm}
        demo={demo}
      />
    </>
  );
}
