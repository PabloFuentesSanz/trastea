import { describe, expect, it } from "vitest";
import {
  EMPTY_SONG_FILTERS,
  facetCounts,
  filterSongs,
  parseSongFilters,
  playableWith,
  songFiltersToQuery,
  type SongCard,
  type SongFilters,
} from "./song-filter";

function song(partial: Partial<SongCard> & Pick<SongCard, "slug">): SongCard {
  return {
    title: partial.slug,
    artist: "Anónimo",
    level: 1,
    key: "C",
    purpose: "",
    style: "rock",
    techniques: [],
    collections: [],
    chords: [],
    ...partial,
  } as SongCard;
}

const CATALOG: SongCard[] = [
  song({
    slug: "cuatro-acordes",
    title: "Cuatro acordes",
    level: 1,
    style: "pop",
    techniques: ["rasgueo", "acordes-abiertos"],
    collections: ["primeras-canciones", "fogata"],
    chords: ["C", "G", "Am", "F"],
  }),
  song({
    slug: "riff-metalero",
    title: "Riff metalero",
    artist: "Los Yunques",
    level: 4,
    style: "metal",
    techniques: ["power-chords", "palm-mute", "downpicking"],
    collections: ["metal-resistencia", "riffs-legendarios"],
    chords: ["E5", "G5"],
  }),
  song({
    slug: "blues-lento",
    title: "Blues lento",
    level: 3,
    style: "blues",
    techniques: ["bending", "pentatonica"],
    collections: ["blues-esencial"],
    chords: ["A7", "D7", "E7"],
  }),
  song({
    slug: "cancion-facil",
    title: "Canción fácil",
    level: 1,
    style: "folk",
    techniques: ["rasgueo"],
    collections: ["primeras-canciones"],
    chords: ["Em", "G"],
  }),
];

describe("filterSongs", () => {
  it("sin filtros devuelve todo ordenado por nivel y título", () => {
    const result = filterSongs(CATALOG, EMPTY_SONG_FILTERS);
    expect(result.map((s) => s.slug)).toEqual([
      "cancion-facil",
      "cuatro-acordes",
      "blues-lento",
      "riff-metalero",
    ]);
  });

  it("filtra por nivel", () => {
    const result = filterSongs(CATALOG, { ...EMPTY_SONG_FILTERS, levels: [1] });
    expect(result).toHaveLength(2);
  });

  it("acumula varios niveles como OR", () => {
    const result = filterSongs(CATALOG, { ...EMPTY_SONG_FILTERS, levels: [3, 4] });
    expect(result.map((s) => s.slug)).toEqual(["blues-lento", "riff-metalero"]);
  });

  it("filtra por estilo", () => {
    const result = filterSongs(CATALOG, { ...EMPTY_SONG_FILTERS, styles: ["metal"] });
    expect(result.map((s) => s.slug)).toEqual(["riff-metalero"]);
  });

  it("exige TODAS las técnicas seleccionadas (AND), no cualquiera", () => {
    const both = filterSongs(CATALOG, {
      ...EMPTY_SONG_FILTERS,
      techniques: ["power-chords", "palm-mute"],
    });
    expect(both.map((s) => s.slug)).toEqual(["riff-metalero"]);

    const impossible = filterSongs(CATALOG, {
      ...EMPTY_SONG_FILTERS,
      techniques: ["power-chords", "bending"],
    });
    expect(impossible).toEqual([]);
  });

  it("filtra por colección", () => {
    const result = filterSongs(CATALOG, {
      ...EMPTY_SONG_FILTERS,
      collections: ["primeras-canciones"],
    });
    expect(result.map((s) => s.slug)).toEqual(["cancion-facil", "cuatro-acordes"]);
  });

  it("busca en título, artista y slug ignorando acentos y mayúsculas", () => {
    expect(
      filterSongs(CATALOG, { ...EMPTY_SONG_FILTERS, query: "CANCION" }).map(
        (s) => s.slug,
      ),
    ).toEqual(["cancion-facil"]);
    expect(
      filterSongs(CATALOG, { ...EMPTY_SONG_FILTERS, query: "yunques" }).map(
        (s) => s.slug,
      ),
    ).toEqual(["riff-metalero"]);
  });

  it("combina filtros de ejes distintos como AND", () => {
    const result = filterSongs(CATALOG, {
      ...EMPTY_SONG_FILTERS,
      levels: [1],
      styles: ["pop"],
    });
    expect(result.map((s) => s.slug)).toEqual(["cuatro-acordes"]);
  });
});

describe("playableWith", () => {
  it("es true cuando todos los acordes de la canción están en lo que sabes", () => {
    expect(playableWith(["Em", "G"], ["G", "C", "Em", "D"])).toBe(true);
  });

  it("es false si falta uno solo", () => {
    expect(playableWith(["C", "G", "Am", "F"], ["C", "G", "Am"])).toBe(false);
  });

  it("ignora espacios y compara sin distinguir mayúsculas del sufijo", () => {
    expect(playableWith([" Am7 "], ["am7"])).toBe(true);
  });

  it("una canción sin acordes catalogados nunca se cuela en el filtro", () => {
    expect(playableWith([], ["C", "G"])).toBe(false);
  });
});

describe("filtro por acordes que ya sabes", () => {
  it("deja solo lo tocable con ese set", () => {
    const result = filterSongs(CATALOG, {
      ...EMPTY_SONG_FILTERS,
      knownChords: ["Em", "G", "C", "D"],
    });
    expect(result.map((s) => s.slug)).toEqual(["cancion-facil"]);
  });
});

describe("facetCounts", () => {
  it("cuenta cada valor sobre el resto de filtros activos", () => {
    const counts = facetCounts(CATALOG, { ...EMPTY_SONG_FILTERS, levels: [1] });
    expect(counts.styles.pop).toBe(1);
    expect(counts.styles.folk).toBe(1);
    expect(counts.styles.metal).toBeUndefined();
    expect(counts.techniques.rasgueo).toBe(2);
  });

  it("para su propio eje ignora el filtro de ese eje (facetas navegables)", () => {
    const counts = facetCounts(CATALOG, { ...EMPTY_SONG_FILTERS, styles: ["metal"] });
    // el eje "styles" se cuenta como si no hubiera filtro de estilo
    expect(counts.styles.pop).toBe(1);
    // los demás ejes sí respetan el filtro de estilo
    expect(counts.levels[4]).toBe(1);
    expect(counts.levels[1]).toBeUndefined();
  });
});

describe("estado en la URL", () => {
  it("ida y vuelta de todos los ejes", () => {
    const filters: SongFilters = {
      query: "blues",
      levels: [2, 3],
      styles: ["blues", "jazz"],
      techniques: ["bending"],
      collections: ["blues-esencial"],
      knownChords: ["A7", "D7"],
    };
    expect(parseSongFilters(new URLSearchParams(songFiltersToQuery(filters)))).toEqual(
      filters,
    );
  });

  it("una URL vacía da filtros vacíos", () => {
    expect(parseSongFilters(new URLSearchParams(""))).toEqual(EMPTY_SONG_FILTERS);
  });

  it("no genera parámetros para los ejes sin usar", () => {
    expect(songFiltersToQuery({ ...EMPTY_SONG_FILTERS, levels: [1] })).toBe("nivel=1");
  });

  it("descarta valores que no existen en la taxonomía", () => {
    const parsed = parseSongFilters(
      new URLSearchParams("estilo=metal,reggaeton&nivel=3,99&tecnica=inventada"),
    );
    expect(parsed.styles).toEqual(["metal"]);
    expect(parsed.levels).toEqual([3]);
    expect(parsed.techniques).toEqual([]);
  });
});
