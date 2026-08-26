/**
 * SM-2 simplificado para las tarjetas de entrenamiento.
 * Puro y testeado: dado el estado de una tarjeta y cómo respondiste,
 * calcula cuándo toca repasarla.
 *
 * Diferencias con SM-2 clásico, a propósito:
 *  - 3 grados en vez de 6 (fallo / cuesta / bien): el mástil se responde
 *    tocando, no puntuando del 0 al 5.
 *  - El primer acierto vuelve a los 10 minutos, no al día siguiente: en una
 *    sesión de 5 minutos quieres reencontrarte con lo que fallaste.
 */

export type Grade = "again" | "hard" | "good";

export interface CardState {
  /** días hasta el próximo repaso (0 = aún no consolidada) */
  intervalDays: number;
  /** factor de facilidad; 1.3 es el suelo clásico de SM-2 */
  ease: number;
  /** repasos correctos consecutivos */
  reps: number;
  /** veces que se ha fallado tras haberla consolidado */
  lapses: number;
}

export const NEW_CARD: CardState = {
  intervalDays: 0,
  ease: 2.5,
  reps: 0,
  lapses: 0,
};

export const MIN_EASE = 1.3;
export const MAX_EASE = 3.0;
/** 10 minutos, en días */
export const RELEARN_INTERVAL = 10 / (60 * 24);

function clampEase(ease: number): number {
  return Math.min(MAX_EASE, Math.max(MIN_EASE, Number(ease.toFixed(3))));
}

/** Estado siguiente tras responder. No toca el reloj: eso lo hace dueDate. */
export function review(state: CardState, grade: Grade): CardState {
  if (grade === "again") {
    return {
      intervalDays: RELEARN_INTERVAL,
      ease: clampEase(state.ease - 0.2),
      reps: 0,
      lapses: state.reps > 0 ? state.lapses + 1 : state.lapses,
    };
  }

  const reps = state.reps + 1;
  const ease = clampEase(state.ease + (grade === "hard" ? -0.15 : 0.1));

  let intervalDays: number;
  if (reps === 1) {
    intervalDays = grade === "hard" ? RELEARN_INTERVAL : 1;
  } else if (reps === 2) {
    intervalDays = grade === "hard" ? 1 : 3;
  } else {
    const previous = Math.max(state.intervalDays, 1);
    const factor = grade === "hard" ? 1.2 : ease;
    intervalDays = Math.round(previous * factor * 10) / 10;
  }

  return { intervalDays, ease, reps, lapses: state.lapses };
}

/** Momento del próximo repaso, en ms epoch. */
export function dueDate(state: CardState, now: number): number {
  return now + state.intervalDays * 24 * 60 * 60 * 1000;
}

export interface DueCard<T> {
  card: T;
  dueAt: number;
  reps: number;
}

/**
 * Selecciona qué repasar: primero lo vencido (más atrasado antes) y luego
 * tarjetas nuevas hasta completar el tamaño de sesión.
 */
export function selectSession<T>(
  cards: readonly DueCard<T>[],
  now: number,
  size: number,
): T[] {
  const due = cards
    .filter((c) => c.dueAt <= now && c.reps > 0)
    .sort((a, b) => a.dueAt - b.dueAt);
  const fresh = cards.filter((c) => c.reps === 0).sort((a, b) => a.dueAt - b.dueAt);

  return [...due, ...fresh].slice(0, size).map((c) => c.card);
}

/** Resumen para la UI: cuántas tocan hoy y cuántas están sin estrenar. */
export function sessionStats<T>(
  cards: readonly DueCard<T>[],
  now: number,
): { due: number; fresh: number; total: number } {
  const due = cards.filter((c) => c.dueAt <= now && c.reps > 0).length;
  const fresh = cards.filter((c) => c.reps === 0).length;
  return { due, fresh, total: cards.length };
}
