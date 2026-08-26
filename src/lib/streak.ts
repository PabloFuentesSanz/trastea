/**
 * Lógica pura de rachas de práctica. Las fechas son strings "YYYY-MM-DD"
 * en la zona horaria del usuario (la calcula el cliente al guardar sesión).
 */

export interface StreakState {
  streakDays: number;
  lastPracticeDate: string | null;
}

function toUtcDate(day: string): number {
  return Date.parse(`${day}T00:00:00Z`);
}

/** Días naturales entre dos fechas YYYY-MM-DD (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((toUtcDate(b) - toUtcDate(a)) / 86_400_000);
}

/**
 * Racha resultante tras practicar en `today`.
 * - primer día o racha rota (>1 día sin practicar) → 1
 * - mismo día → sin cambio
 * - día consecutivo → +1
 */
export function nextStreak(state: StreakState, today: string): StreakState {
  const { streakDays, lastPracticeDate } = state;
  if (!lastPracticeDate) return { streakDays: 1, lastPracticeDate: today };

  const gap = daysBetween(lastPracticeDate, today);
  if (gap <= 0) return { streakDays: Math.max(streakDays, 1), lastPracticeDate };
  if (gap === 1) return { streakDays: streakDays + 1, lastPracticeDate: today };
  return { streakDays: 1, lastPracticeDate: today };
}

/** Racha vigente al consultarla (0 si se rompió ayer sin practicar hoy). */
export function currentStreak(state: StreakState, today: string): number {
  if (!state.lastPracticeDate) return 0;
  const gap = daysBetween(state.lastPracticeDate, today);
  return gap <= 1 ? state.streakDays : 0;
}
