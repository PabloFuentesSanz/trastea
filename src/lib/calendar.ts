/**
 * Aritmética de días naturales sobre strings "YYYY-MM-DD".
 *
 * Nunca se construye un `Date` local: se opera en UTC y se devuelve el string
 * otra vez. Así el mismo día es el mismo día en el servidor y en el navegador,
 * que es donde se cuela el error de un día de diferencia.
 */

const MS_DIA = 86_400_000;

function utc(day: string): number {
  return Date.parse(`${day}T00:00:00Z`);
}

function iso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Días naturales entre dos fechas YYYY-MM-DD (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((utc(b) - utc(a)) / MS_DIA);
}

/** La fecha `n` días después (o antes, con n negativo). */
export function addDays(day: string, n: number): string {
  return iso(utc(day) + n * MS_DIA);
}

/** Día de la semana con el lunes como 0, que es como empieza la semana aquí. */
export function weekdayMonday(day: string): number {
  return (new Date(utc(day)).getUTCDay() + 6) % 7;
}

/** El lunes de la semana en la que cae `day`. */
export function startOfWeek(day: string): string {
  return addDays(day, -weekdayMonday(day));
}

/** Número de mes (1-12) de una fecha. */
export function monthOf(day: string): number {
  return Number(day.slice(5, 7));
}
