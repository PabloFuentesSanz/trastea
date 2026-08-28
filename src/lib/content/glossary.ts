/**
 * El glosario, leído del propio artículo de la wiki.
 *
 * Las definiciones son contenido educativo y viven en MDX, como el resto del
 * contenido: aquí solo se leen para poder enseñarlas donde hagan falta —al
 * pasar por encima de la palabra en una lección, en una canción o en una
 * ficha— sin que el lector tenga que irse a buscarlas.
 */

export interface EntradaGlosario {
  /** como se escribe en el glosario: "Octavación (quintaje)" */
  termino: string;
  /** por lo que se busca en el texto, en minúsculas y sin paréntesis */
  busca: string;
  /** la definición, en una línea */
  definicion: string;
  /** la ficha que lo cuenta entero */
  ficha?: string;
}

const ENTRADA = /^\*\*(.+?)\.?\*\*\s*([\s\S]+)$/;

export function parseGlosario(mdx: string): EntradaGlosario[] {
  const entradas: EntradaGlosario[] = [];
  for (const bloque of mdx.split(/\n{2,}/)) {
    const m = ENTRADA.exec(bloque.trim());
    if (!m) continue;
    const termino = m[1].trim();
    const cuerpo = m[2].replace(/\s+/g, " ").trim();
    const ficha = /\[\[([a-z0-9-]+)\]\]/.exec(cuerpo)?.[1];
    const definicion = cuerpo
      // "Ver [[x]]." y "Ver [[x]] y [[y]]." son navegación, no definición
      .replace(/\s*(Ver|No confundir con)\s+\[\[[\s\S]*$/i, "")
      .replace(/\[\[([a-z0-9-]+)\]\]/g, "$1")
      .trim();
    entradas.push({
      termino,
      busca: termino
        .replace(/\s*\([^)]*\)/g, "")
        .trim()
        .toLowerCase(),
      definicion,
      ficha,
    });
  }
  return entradas;
}
