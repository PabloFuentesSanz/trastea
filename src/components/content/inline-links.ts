/**
 * Enlaces markdown dentro de un texto plano.
 *
 * Los valores de `<Ficha>` son atributos, no MDX: un `[texto](/ruta)` escrito
 * ahí salía impreso con los corchetes. Pasaba de verdad en el ejercicio del
 * primer día del curso, con el enlace a las permutaciones del cromático.
 *
 * Solo se aceptan rutas internas (`/algo`): un atributo de contenido no tiene
 * por qué poder abrir nada de fuera.
 */

export type Trozo =
  { tipo: "texto"; texto: string } | { tipo: "enlace"; texto: string; href: string };

const ENLACE = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;

export function splitInlineLinks(texto: string): Trozo[] {
  const trozos: Trozo[] = [];
  let ultimo = 0;
  for (const m of texto.matchAll(ENLACE)) {
    if (m.index > ultimo) {
      trozos.push({ tipo: "texto", texto: texto.slice(ultimo, m.index) });
    }
    trozos.push({ tipo: "enlace", texto: m[1], href: m[2] });
    ultimo = m.index + m[0].length;
  }
  if (ultimo < texto.length) {
    trozos.push({ tipo: "texto", texto: texto.slice(ultimo) });
  }
  return trozos.length > 0 ? trozos : [{ tipo: "texto", texto }];
}
