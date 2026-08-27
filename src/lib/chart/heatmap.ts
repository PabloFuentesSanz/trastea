/**
 * El calendario de práctica: una casilla por día, más oscura cuanto más rato.
 *
 * Pura, como el resto de la lógica: aquí se decide qué día va en qué casilla
 * y de qué nivel; el color y el SVG los pone el componente.
 */

import { addDays, daysBetween, monthOf, startOfWeek } from "@/lib/calendar";

export interface DayMinutes {
  /** "YYYY-MM-DD" */
  date: string;
  minutes: number;
}

export type HeatLevel = 0 | 1 | 2 | 3 | 4;

export interface HeatCell {
  date: string;
  minutes: number;
  level: HeatLevel;
  /** false para los días de la semana en curso que aún no han llegado */
  inRange: boolean;
}

export interface MonthLabel {
  label: string;
  /** índice de la semana (columna) donde empieza el mes */
  column: number;
}

export interface HeatmapGrid {
  /** una columna por semana, siete filas de lunes a domingo */
  weeks: HeatCell[][];
  months: MonthLabel[];
  /** minutos totales de la ventana */
  total: number;
  /** días con al menos un minuto */
  practicedDays: number;
  /** racha viva contando hacia atrás desde hoy */
  streak: number;
  /** la racha más larga que hubo dentro de la ventana */
  bestStreak: number;
}

/**
 * Tramos pensados para cómo se practica, no repartidos por percentiles: hasta
 * un cuarto de hora es un repaso, media hora es una sesión, una hora es un día
 * bueno.
 */
export function heatLevel(minutes: number): HeatLevel {
  if (minutes <= 0) return 0;
  if (minutes < 15) return 1;
  if (minutes < 30) return 2;
  if (minutes < 60) return 3;
  return 4;
}

const MESES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

export function heatmapGrid(
  sessions: readonly DayMinutes[],
  { today, weeks }: { today: string; weeks: number },
): HeatmapGrid {
  // la rejilla acaba en la semana de hoy y empieza `weeks - 1` semanas antes,
  // siempre en lunes, para que las columnas cuadren con los meses
  const first = addDays(startOfWeek(today), -(weeks - 1) * 7);

  const porDia = new Map<string, number>();
  for (const s of sessions) {
    porDia.set(s.date, (porDia.get(s.date) ?? 0) + s.minutes);
  }

  const grid: HeatCell[][] = [];
  let total = 0;
  let practicedDays = 0;

  for (let w = 0; w < weeks; w += 1) {
    const semana: HeatCell[] = [];
    for (let d = 0; d < 7; d += 1) {
      const date = addDays(first, w * 7 + d);
      const inRange = daysBetween(date, today) >= 0;
      const minutes = inRange ? (porDia.get(date) ?? 0) : 0;
      if (minutes > 0) {
        total += minutes;
        practicedDays += 1;
      }
      semana.push({ date, minutes, level: heatLevel(minutes), inRange });
    }
    grid.push(semana);
  }

  return {
    weeks: grid,
    months: monthLabels(grid),
    total,
    practicedDays,
    streak: currentStreak(porDia, today),
    bestStreak: bestStreak(grid),
  };
}

/**
 * Cuenta hacia atrás desde hoy. Si hoy todavía no has tocado no se da por
 * rota: el día no ha terminado, y castigar a las once de la mañana sería
 * absurdo. Dos días sin tocar sí la rompen.
 */
function currentStreak(porDia: Map<string, number>, today: string): number {
  const desde = (porDia.get(today) ?? 0) > 0 ? today : addDays(today, -1);
  let dias = 0;
  for (let day = desde; (porDia.get(day) ?? 0) > 0; day = addDays(day, -1)) {
    dias += 1;
  }
  return dias;
}

function bestStreak(grid: HeatCell[][]): number {
  let mejor = 0;
  let corrida = 0;
  for (const cell of grid.flat()) {
    if (!cell.inRange) continue;
    corrida = cell.minutes > 0 ? corrida + 1 : 0;
    mejor = Math.max(mejor, corrida);
  }
  return mejor;
}

/** Un rótulo por mes, en la primera columna cuyo lunes ya cae dentro de él. */
function monthLabels(grid: HeatCell[][]): MonthLabel[] {
  const labels: MonthLabel[] = [];
  let anterior = -1;
  grid.forEach((semana, column) => {
    const mes = monthOf(semana[0].date);
    if (mes !== anterior) {
      labels.push({ label: MESES[mes - 1], column });
      anterior = mes;
    }
  });
  return labels;
}
