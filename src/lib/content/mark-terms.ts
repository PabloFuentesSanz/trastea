/**
 * Marcar en un texto las palabras del glosario, una sola vez por página.
 *
 * La regla de "una sola vez" no es un detalle: una página con quince palabras
 * subrayadas no se lee, y la segunda vez que aparece un término ya sabes
 * dónde mirar.
 */

export interface TerminoBuscable {
  /** en minúsculas, como se busca */
  busca: string;
  /** como se llama la entrada del glosario */
  termino: string;
}

export interface Trozo {
  texto: string;
  /** presente si este trozo es una palabra del glosario */
  termino?: string;
}

const ESCAPAR = /[.*+?^${}()|[\]\\]/g;

/**
 * Las formas en las que puede aparecer el término. En el texto se habla en
 * plural ("dos riffs", "las inversiones") y esa sigue siendo la palabra.
 */
export function formasDe(busca: string): string[] {
  if (busca.endsWith("s")) return [busca];
  if (/ón$/.test(busca)) return [busca, busca.replace(/ón$/, "ones")];
  return [busca, `${busca}s`, `${busca}es`];
}

/** Los bordes de palabra de JS no valen con acentos: se hacen a mano. */
function regexDe(busca: string): RegExp {
  const formas = formasDe(busca)
    .sort((a, b) => b.length - a.length)
    .map((f) => f.replace(ESCAPAR, "\\$&"))
    .join("|");
  return new RegExp(`(^|[^\\p{L}\\p{N}])(${formas})([^\\p{L}\\p{N}]|$)`, "iu");
}

export function marcarTexto(
  texto: string,
  indice: readonly TerminoBuscable[],
  yaVistos: Set<string>,
): Trozo[] {
  // el más largo primero: "púa alterna" gana a "púa"
  const candidatos = [...indice]
    .filter((t) => !yaVistos.has(t.termino))
    .sort((a, b) => b.busca.length - a.busca.length);

  let mejor: { indice: number; largo: number; termino: string } | undefined;
  for (const t of candidatos) {
    const m = regexDe(t.busca).exec(texto);
    if (!m) continue;
    const inicio = m.index + m[1].length;
    if (mejor === undefined || inicio < mejor.indice) {
      mejor = { indice: inicio, largo: m[2].length, termino: t.termino };
    }
  }
  if (mejor === undefined) return [{ texto }];

  yaVistos.add(mejor.termino);
  const antes = texto.slice(0, mejor.indice);
  const palabra = texto.slice(mejor.indice, mejor.indice + mejor.largo);
  const despues = texto.slice(mejor.indice + mejor.largo);
  return [
    ...(antes ? [{ texto: antes }] : []),
    { texto: palabra, termino: mejor.termino },
    ...marcarTexto(despues, indice, yaVistos),
  ];
}
