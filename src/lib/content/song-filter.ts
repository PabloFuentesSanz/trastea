/**
 * Filtrado y facetas del catálogo de canciones. Lógica pura: la usa la página
 * /canciones (con el estado en la URL) y también el curso para pedir
 * repertorio por técnica y nivel.
 */

import {
  SONG_COLLECTIONS,
  SONG_STYLES,
  SONG_TECHNIQUES,
  type SongCollection,
  type SongStyle,
  type SongTechnique,
} from "./song-taxonomy";

export interface SongCard {
  slug: string;
  title: string;
  artist: string;
  level: number;
  key: string;
  purpose: string;
  style: SongStyle;
  techniques: SongTechnique[];
  collections: SongCollection[];
  chords: string[];
  progression?: string;
  year?: number;
  bpm?: number;
  tuning?: string;
  capo?: number;
}

export interface SongFilters {
  query: string;
  levels: number[];
  styles: SongStyle[];
  techniques: SongTechnique[];
  collections: SongCollection[];
  /** acordes que el usuario ya domina; deja solo lo tocable con ellos */
  knownChords: string[];
}

export const EMPTY_SONG_FILTERS: SongFilters = {
  query: "",
  levels: [],
  styles: [],
  techniques: [],
  collections: [],
  knownChords: [],
};

export const SONG_LEVELS = [1, 2, 3, 4, 5] as const;

/** Sin acentos ni mayúsculas: buscar "cancion" tiene que encontrar "Canción". */
function norm(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normChord(chord: string): string {
  return chord.trim().toLowerCase();
}

/**
 * ¿Puedo tocarla con los acordes que sé? Todos los de la canción tienen que
 * estar en mi lista. Una canción sin acordes catalogados no cuenta: no
 * sabemos qué exige, así que no prometemos que se pueda.
 */
export function playableWith(songChords: string[], known: string[]): boolean {
  if (songChords.length === 0) return false;
  const mine = new Set(known.map(normChord));
  return songChords.every((chord) => mine.has(normChord(chord)));
}

type FilterAxis = "levels" | "styles" | "techniques" | "collections";

function matches(song: SongCard, filters: SongFilters, skip?: FilterAxis): boolean {
  if (
    skip !== "levels" &&
    filters.levels.length > 0 &&
    !filters.levels.includes(song.level)
  ) {
    return false;
  }
  if (
    skip !== "styles" &&
    filters.styles.length > 0 &&
    !filters.styles.includes(song.style)
  ) {
    return false;
  }
  // técnicas y colecciones son AND: "quiero cejilla Y palm mute"
  if (
    skip !== "techniques" &&
    !filters.techniques.every((t) => song.techniques.includes(t))
  ) {
    return false;
  }
  if (
    skip !== "collections" &&
    !filters.collections.every((c) => song.collections.includes(c))
  ) {
    return false;
  }
  if (filters.knownChords.length > 0 && !playableWith(song.chords, filters.knownChords)) {
    return false;
  }
  const q = norm(filters.query.trim());
  if (
    q &&
    !norm(`${song.title} ${song.artist} ${song.slug} ${song.purpose}`).includes(q)
  ) {
    return false;
  }
  return true;
}

export function compareSongs(a: SongCard, b: SongCard): number {
  return a.level - b.level || a.title.localeCompare(b.title, "es");
}

export function filterSongs(songs: SongCard[], filters: SongFilters): SongCard[] {
  return songs.filter((song) => matches(song, filters)).sort(compareSongs);
}

export interface FacetCounts {
  levels: Record<number, number>;
  styles: Partial<Record<SongStyle, number>>;
  techniques: Partial<Record<SongTechnique, number>>;
  collections: Partial<Record<SongCollection, number>>;
}

function tally<K extends string | number>(
  target: Record<K, number> | Partial<Record<K, number>>,
  key: K,
): void {
  const counts = target as Record<K, number>;
  counts[key] = (counts[key] ?? 0) + 1;
}

/**
 * Cuenta cuántos resultados quedarían al pulsar cada valor. Cada eje se cuenta
 * ignorando su propio filtro, que es lo que hace que las facetas sigan siendo
 * navegables una vez has elegido algo dentro de ellas.
 */
export function facetCounts(songs: SongCard[], filters: SongFilters): FacetCounts {
  const counts: FacetCounts = { levels: {}, styles: {}, techniques: {}, collections: {} };

  for (const song of songs) {
    if (matches(song, filters, "levels")) tally(counts.levels, song.level);
    if (matches(song, filters, "styles")) tally(counts.styles, song.style);
    if (matches(song, filters, "techniques")) {
      for (const technique of song.techniques) tally(counts.techniques, technique);
    }
    if (matches(song, filters, "collections")) {
      for (const collection of song.collections) tally(counts.collections, collection);
    }
  }

  return counts;
}

// ---------- estado en la URL ----------

const PARAM = {
  query: "q",
  levels: "nivel",
  styles: "estilo",
  techniques: "tecnica",
  collections: "coleccion",
  knownChords: "acordes",
} as const;

function splitList(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function parseSongFilters(params: URLSearchParams): SongFilters {
  const styles = new Set<string>(SONG_STYLES);
  const techniques = new Set<string>(SONG_TECHNIQUES);
  const collections = new Set<string>(SONG_COLLECTIONS);

  return {
    query: params.get(PARAM.query) ?? "",
    levels: splitList(params.get(PARAM.levels))
      .map((v) => Number(v))
      .filter((n) => Number.isInteger(n) && n >= 1 && n <= 5),
    styles: splitList(params.get(PARAM.styles)).filter((v): v is SongStyle =>
      styles.has(v),
    ),
    techniques: splitList(params.get(PARAM.techniques)).filter((v): v is SongTechnique =>
      techniques.has(v),
    ),
    collections: splitList(params.get(PARAM.collections)).filter(
      (v): v is SongCollection => collections.has(v),
    ),
    knownChords: splitList(params.get(PARAM.knownChords)),
  };
}

export function songFiltersToQuery(filters: SongFilters): string {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set(PARAM.query, filters.query.trim());
  if (filters.levels.length) params.set(PARAM.levels, filters.levels.join(","));
  if (filters.styles.length) params.set(PARAM.styles, filters.styles.join(","));
  if (filters.techniques.length)
    params.set(PARAM.techniques, filters.techniques.join(","));
  if (filters.collections.length) {
    params.set(PARAM.collections, filters.collections.join(","));
  }
  if (filters.knownChords.length) {
    params.set(PARAM.knownChords, filters.knownChords.join(","));
  }
  return params.toString();
}

export function hasActiveFilters(filters: SongFilters): boolean {
  return (
    filters.query.trim() !== "" ||
    filters.levels.length > 0 ||
    filters.styles.length > 0 ||
    filters.techniques.length > 0 ||
    filters.collections.length > 0 ||
    filters.knownChords.length > 0
  );
}

/** Acordes distintos del catálogo, del más común al menos, para el selector. */
export function chordVocabulary(songs: SongCard[]): { chord: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const song of songs) {
    for (const chord of song.chords) {
      const key = chord.trim();
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([chord, count]) => ({ chord, count }))
    .sort((a, b) => b.count - a.count || a.chord.localeCompare(b.chord, "es"));
}

/** Repertorio de una colección, en orden de dificultad. */
export function songsInCollection(
  songs: SongCard[],
  collection: SongCollection,
): SongCard[] {
  return songs.filter((s) => s.collections.includes(collection)).sort(compareSongs);
}

/**
 * "Si te ha gustado esta, prueba estas": misma colección o técnicas comunes,
 * priorizando nivel parecido. Lo usa la ficha de canción.
 */
export function relatedSongs(songs: SongCard[], target: SongCard, limit = 6): SongCard[] {
  return songs
    .filter((s) => s.slug !== target.slug)
    .map((s) => {
      const sharedCollections = s.collections.filter((c) =>
        target.collections.includes(c),
      ).length;
      const sharedTechniques = s.techniques.filter((t) =>
        target.techniques.includes(t),
      ).length;
      const styleBonus = s.style === target.style ? 2 : 0;
      const levelPenalty = Math.abs(s.level - target.level);
      return {
        song: s,
        score: sharedCollections * 3 + sharedTechniques * 2 + styleBonus - levelPenalty,
      };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || compareSongs(a.song, b.song))
    .slice(0, limit)
    .map(({ song }) => song);
}
