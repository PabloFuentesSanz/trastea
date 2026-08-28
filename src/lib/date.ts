/**
 * La fecha de hoy del usuario, no la del servidor.
 *
 * Una sesión se guarda con la fecha local de quien practica: si a las 00:30 de
 * un martes en España se guardara la fecha UTC, la sesión caería en lunes y la
 * racha contaría mal.
 */
export function todayLocal(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
