/**
 * El orden real del curso.
 *
 * El tronco (Desde cero → A → B → C) va módulo a módulo y semana a semana.
 * Las semanas de estilo —blues, rock, folk, jazz, metal— no son un módulo
 * más al final: se **intercalan** entre las del tronco, y cada una declara
 * detrás de cuál va con `after`. Así se puede meter una semana de blues
 * entre la 2 y la 3 sin renumerar nada ni romper los slugs que el progreso
 * de la gente ya tiene guardados.
 */

export interface SemanaFuente {
  slug: string;
  order: number;
  moduleSlug: string;
  moduleOrder: number;
  /** slug de la semana del tronco detrás de la que se coloca */
  after?: string;
  /**
   * semana que manda para el nivel, si no es la propia: el módulo Desde cero
   * es nivel 1 entero aunque tenga cuatro semanas
   */
  semanaDeNivel?: number;
}

export interface SemanaOrdenada extends SemanaFuente {
  /** posición en el curso entero, desde 1 */
  posicion: number;
  /**
   * la semana que se usa para deducir el nivel de sus ejercicios: la suya si
   * es del tronco, la de su ancla si es de estilo
   */
  semanaDeNivel: number;
}

export interface Secuencia extends Array<SemanaOrdenada> {
  /** semanas con un `after` que no apunta a ninguna semana del tronco */
  huerfanas: string[];
}

export function ordenarSemanas(fuente: readonly SemanaFuente[]): Secuencia {
  const porOrden = (a: SemanaFuente, b: SemanaFuente) =>
    a.moduleOrder - b.moduleOrder || a.order - b.order;

  const troncales = fuente.filter((s) => s.after === undefined).sort(porOrden);
  const colgadas = fuente.filter((s) => s.after !== undefined).sort(porOrden);
  const anclas = new Set(troncales.map((s) => s.slug));

  const secuencia = [] as unknown as Secuencia;
  secuencia.huerfanas = colgadas
    .filter((s) => !anclas.has(s.after as string))
    .map((s) => s.slug);

  for (const semana of troncales) {
    const nivel = semana.semanaDeNivel ?? semana.order;
    secuencia.push({ ...semana, posicion: secuencia.length + 1, semanaDeNivel: nivel });
    for (const colgada of colgadas.filter((s) => s.after === semana.slug)) {
      secuencia.push({
        ...colgada,
        posicion: secuencia.length + 1,
        semanaDeNivel: nivel,
      });
    }
  }
  return secuencia;
}
