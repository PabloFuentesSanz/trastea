"use client";

import { useCallback, useRef, useState } from "react";
import { playNotes } from "@/lib/audio/pluck";

/**
 * Escuchar una escala (nota a nota) o un acorde (rasgueado).
 *
 * Antes esto eran osciladores triangulares, que es exactamente lo que suena a
 * sintetizador barato. Ahora usa la misma cuerda sintetizada que las bases y
 * los ejercicios de oído, con el instrumento que tengas elegido: un solo
 * timbre en toda la app.
 */
export function useFormulaPlayer() {
  const [playing, setPlaying] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const play = useCallback(async (midis: number[], mode: "sequence" | "chord") => {
    if (midis.length === 0) return;

    const segundos =
      mode === "chord"
        ? await playNotes(midis, { strum: 0.04, duration: 1.6 })
        : await playNotes(midis, { gap: 0.32, duration: 0.55 });

    setPlaying(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setPlaying(false), segundos * 1000);
  }, []);

  return { play, playing };
}
