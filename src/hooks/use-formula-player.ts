"use client";

import { useCallback, useRef, useState } from "react";
import { midiToFrequency } from "@/lib/music/fretboard";
import { audioContext, audioNow, resumeAudio } from "@/lib/audio/context";

/** Reproduce secuencias (escala) o bloques (acorde) con osciladores simples. */
export function useFormulaPlayer() {
  const [playing, setPlaying] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playNote = useCallback((midi: number, time: number, duration: number) => {
    const ctx = audioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = midiToFrequency(midi);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.35, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + duration + 0.05);
  }, []);

  const play = useCallback(
    async (midis: number[], mode: "sequence" | "chord") => {
      if (midis.length === 0) return;
      await resumeAudio();
      const ctx = audioContext();
      const start = ctx.currentTime + 0.05;
      const step = 0.32;

      if (mode === "chord") {
        // pequeño arpegiado y luego el bloque
        midis.forEach((midi, i) => playNote(midi, start + i * 0.06, 1.2));
        midis.forEach((midi) => playNote(midi, start + midis.length * 0.06 + 0.8, 1.4));
      } else {
        midis.forEach((midi, i) => playNote(midi, start + i * step, 0.4));
      }

      setPlaying(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const totalMs = mode === "chord" ? 2600 : midis.length * step * 1000 + 500;
      timeoutRef.current = setTimeout(() => setPlaying(false), totalMs);
    },
    [playNote],
  );

  return { play, playing };
}
