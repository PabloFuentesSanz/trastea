/**
 * El título de una lección lleva "— día N" para poder leerse suelto en una
 * lista. En el reproductor la miga de pan ya dice "Semana 10 · Día 1", así
 * que repetirlo solo sirve para que el título no quepa y se corte.
 */
const SUFIJO_DIA = /\s*—\s*d[íi]a\s+\d+\s*$/i;

export function tituloSinDia(titulo: string): string {
  return titulo.replace(SUFIJO_DIA, "");
}
