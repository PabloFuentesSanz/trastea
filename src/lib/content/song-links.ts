/**
 * Enlaces externos de una canción.
 *
 * Mientras no tengamos tablatura propia, el destino es Songsterr. Un enlace
 * directo a una tab concreta es mejor (cae en el compás que quieres), pero
 * requiere conocer su id; cuando no lo tenemos, la búsqueda por título y
 * artista siempre resuelve y nunca lleva a un 404.
 *
 * El formato vive aquí y solo aquí: si Songsterr cambia sus URLs, se toca
 * esta función y se arregla todo el contenido de golpe.
 */

const SONGSTERR_SEARCH = "https://www.songsterr.com/";
const YOUTUBE_SEARCH = "https://www.youtube.com/results";

export type SongLinkKind = "tab" | "search";

export interface SongLink {
  href: string;
  kind: SongLinkKind;
}

export interface SongRef {
  title: string;
  artist?: string;
  /** URL directa a la tab, si la hemos verificado */
  songsterr?: string;
  youtube?: string;
}

function query(ref: SongRef): string {
  return [ref.title, ref.artist].filter(Boolean).join(" ");
}

export function songsterrSearchUrl(ref: SongRef): string {
  const url = new URL(SONGSTERR_SEARCH);
  url.searchParams.set("pattern", query(ref));
  return url.toString();
}

/** Enlace a la tab: directo si lo tenemos, búsqueda si no. */
export function songsterrLink(ref: SongRef): SongLink {
  if (ref.songsterr && ref.songsterr.startsWith("https://www.songsterr.com/")) {
    return { href: ref.songsterr, kind: "tab" };
  }
  return { href: songsterrSearchUrl(ref), kind: "search" };
}

export function youtubeSearchUrl(ref: SongRef): string {
  const url = new URL(YOUTUBE_SEARCH);
  url.searchParams.set("search_query", query(ref));
  return url.toString();
}

export function youtubeLink(ref: SongRef): SongLink {
  if (ref.youtube) return { href: ref.youtube, kind: "tab" };
  return { href: youtubeSearchUrl(ref), kind: "search" };
}
