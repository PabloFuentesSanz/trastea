import { describe, expect, it } from "vitest";
import {
  songsterrLink,
  songsterrSearchUrl,
  youtubeLink,
  youtubeSearchUrl,
} from "./song-links";

describe("songsterrSearchUrl", () => {
  it("busca por título y artista", () => {
    const url = songsterrSearchUrl({
      title: "Stairway to Heaven",
      artist: "Led Zeppelin",
    });
    expect(url).toContain("songsterr.com");
    expect(new URL(url).searchParams.get("pattern")).toBe(
      "Stairway to Heaven Led Zeppelin",
    );
  });

  it("funciona sin artista", () => {
    const url = songsterrSearchUrl({ title: "Blues en Fa" });
    expect(new URL(url).searchParams.get("pattern")).toBe("Blues en Fa");
  });

  it("escapa acentos y símbolos", () => {
    const url = songsterrSearchUrl({ title: "Entre dos aguas", artist: "Paco de Lucía" });
    expect(url).not.toContain(" ");
    expect(new URL(url).searchParams.get("pattern")).toContain("Lucía");
  });
});

describe("songsterrLink", () => {
  it("prefiere la tab directa cuando la tenemos verificada", () => {
    expect(
      songsterrLink({
        title: "Autumn Leaves",
        songsterr: "https://www.songsterr.com/a/wsa/x-tab-s439171",
      }),
    ).toEqual({ href: "https://www.songsterr.com/a/wsa/x-tab-s439171", kind: "tab" });
  });

  it("cae a la búsqueda si no hay tab directa", () => {
    expect(songsterrLink({ title: "Blue Bossa" }).kind).toBe("search");
  });

  it("ignora una URL que no sea de songsterr, para no colar enlaces raros", () => {
    const link = songsterrLink({
      title: "Blue Bossa",
      songsterr: "https://ejemplo.com/tab",
    });
    expect(link.kind).toBe("search");
    expect(link.href).toContain("songsterr.com");
  });

  it("una URL ?pattern= antigua se trata como enlace directo válido", () => {
    // el contenido viejo la usa; sigue llevando a Songsterr, no rompe nada
    expect(
      songsterrLink({
        title: "x",
        songsterr: "https://www.songsterr.com/?pattern=Blue+Bossa",
      }).kind,
    ).toBe("tab");
  });
});

describe("youtubeLink", () => {
  it("busca cuando no hay vídeo concreto", () => {
    const link = youtubeLink({ title: "Chameleon", artist: "Herbie Hancock" });
    expect(link.kind).toBe("search");
    expect(new URL(link.href).searchParams.get("search_query")).toBe(
      "Chameleon Herbie Hancock",
    );
  });

  it("respeta el vídeo concreto si lo hay", () => {
    expect(youtubeLink({ title: "x", youtube: "https://youtu.be/abc" })).toEqual({
      href: "https://youtu.be/abc",
      kind: "tab",
    });
  });

  it("youtubeSearchUrl es una URL válida", () => {
    expect(() => new URL(youtubeSearchUrl({ title: "Take Five" }))).not.toThrow();
  });
});
