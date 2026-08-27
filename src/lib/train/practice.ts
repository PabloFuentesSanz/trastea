/**
 * La aritmética de una sesión de práctica cronometrada: el reloj, la escalera
 * de tempos y el resumen de lo que has hecho.
 *
 * Pura, así que se puede comprobar lo que de verdad importa: que un bpm alto
 * pero sucio **no** cuente como marca. Subir el número mintiendo es la forma
 * más rápida de dejar de mejorar.
 */

import { clampBpm } from "@/lib/metronome/pattern";

/** Paso estándar al subir tempo: ni un salto ni un placebo. */
export const BPM_STEP = 5;

export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

/**
 * Los tempos por los que pasar, del inicio al objetivo. El objetivo entra
 * siempre aunque no caiga en el paso: si la ficha dice 82, se llega a 82.
 */
export function bpmLadder(start: number, target: number): number[] {
  const desde = clampBpm(start);
  const hasta = clampBpm(target);
  if (hasta <= desde) return [desde];

  const pasos: number[] = [];
  for (let bpm = desde; bpm < hasta && pasos.length < 39; bpm += BPM_STEP) {
    pasos.push(bpm);
  }
  pasos.push(hasta);
  return pasos;
}

/** Adónde ir después de un intento: arriba si salió limpio, abajo si no. */
export function nextBpm(current: number, clean: boolean, target: number): number {
  const siguiente = clean ? current + BPM_STEP : current - BPM_STEP;
  return clampBpm(Math.min(siguiente, clean ? clampBpm(target) : siguiente));
}

export interface PracticeAttempt {
  bpm: number;
  clean: boolean;
}

export interface PracticeSummary {
  minutes: number;
  attempts: number;
  /** el bpm más alto alcanzado **limpio**; null si no hubo ninguno */
  bestClean: number | null;
  headline: string;
}

export function practiceSummary({
  seconds,
  attempts,
}: {
  seconds: number;
  attempts: readonly PracticeAttempt[];
}): PracticeSummary {
  // al más cercano, no hacia arriba: 5:10 son 5 minutos, no 6, y este número
  // alimenta el calendario de práctica. Pero si has tocado algo, cuenta 1
  const segundos = Math.max(0, seconds);
  const minutes = segundos === 0 ? 0 : Math.max(1, Math.round(segundos / 60));
  const limpios = attempts.filter((a) => a.clean).map((a) => a.bpm);
  const bestClean = limpios.length > 0 ? Math.max(...limpios) : null;

  const headline =
    attempts.length === 0
      ? `${minutes} min practicados, sin registrar ningún tempo`
      : bestClean === null
        ? `${minutes} min y ${attempts.length} intentos, ninguno limpio todavía`
        : `${minutes} min · mejor marca limpia: ${bestClean} bpm`;

  return { minutes, attempts: attempts.length, bestClean, headline };
}
