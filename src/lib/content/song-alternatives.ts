import { EMPTY_SONG_FILTERS, songFiltersToQuery, type SongCard } from "./song-filter";
import type { SongTechnique } from "./song-taxonomy";

/**
 * Otras canciones que valen para lo mismo.
 *
 * El catálogo tiene 304 canciones y las 60 lecciones apuntan a 16: si la del
 * curso no te engancha, no había alternativa. Estas se eligen por lo que
 * entrenan, no por el título, y nunca por encima del techo del módulo — que
 * es lo que evita que aparezca un estándar de jazz en la semana 1.
 */
export interface OpcionesAlternativas {
  /** lo que la canción del curso viene a practicar */
  tecnicas: readonly string[];
  /** techo del módulo: `max_song_level` */
  nivelMaximo: number;
  /** la que ya manda la lección */
  excluir: string;
  /** el estilo de la del curso, para no irse de género */
  estilo?: string;
  cuantas?: number;
}

export function alternativasParaPracticar(
  catalogo: readonly SongCard[],
  { tecnicas, nivelMaximo, excluir, estilo, cuantas = 3 }: OpcionesAlternativas,
): SongCard[] {
  if (tecnicas.length === 0) return [];

  return catalogo
    .filter((s) => s.slug !== excluir && s.level <= nivelMaximo)
    .map((s) => ({
      cancion: s,
      // el estilo desempata: si la del curso es un funk, las otras también.
      // Sin esto la lista salía por orden alfabético, que no es un criterio
      comparte:
        s.techniques.filter((t) => tecnicas.includes(t)).length +
        (estilo !== undefined && s.style === estilo ? 0.5 : 0),
    }))
    .filter(({ comparte }) => comparte > 0)
    .sort(
      (a, b) =>
        b.comparte - a.comparte ||
        a.cancion.level - b.cancion.level ||
        a.cancion.slug.localeCompare(b.cancion.slug),
    )
    .slice(0, cuantas)
    .map(({ cancion }) => cancion);
}

/**
 * El catálogo, ya filtrado por lo que se está practicando hoy. El formato de
 * la query lo pone la misma función que usa /canciones: si cambia allí,
 * cambia aquí.
 */
export function enlaceDeCatalogo(
  tecnicas: readonly string[],
  nivelMaximo: number,
): string {
  const query = songFiltersToQuery({
    ...EMPTY_SONG_FILTERS,
    techniques: [...tecnicas] as SongTechnique[],
    levels: Array.from({ length: nivelMaximo }, (_, i) => i + 1),
  });
  return `/canciones?${query}`;
}
