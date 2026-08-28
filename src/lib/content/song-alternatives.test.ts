import { describe, expect, it } from "vitest";
import { alternativasParaPracticar, enlaceDeCatalogo } from "./song-alternatives";
import type { SongCard } from "./song-filter";

const cancion = (
  slug: string,
  level: number,
  techniques: string[],
  style = "rock",
): SongCard =>
  ({
    slug,
    title: slug,
    artist: "x",
    level,
    key: "C",
    purpose: "",
    style,
    techniques,
    collections: [],
    chords: [],
  }) as unknown as SongCard;

const CATALOGO = [
  cancion("la-del-curso", 2, ["palm-mute", "pua-alterna"]),
  cancion("misma-tecnica-mismo-nivel", 2, ["palm-mute"]),
  cancion("dos-tecnicas", 2, ["palm-mute", "pua-alterna"]),
  cancion("mas-facil", 1, ["palm-mute"]),
  cancion("demasiado-dificil", 5, ["palm-mute"]),
  cancion("otra-cosa", 2, ["fingerstyle"]),
];

describe("alternativasParaPracticar", () => {
  const opciones = {
    tecnicas: ["palm-mute", "pua-alterna"],
    nivelMaximo: 3,
    excluir: "la-del-curso",
  };

  it("no propone la que ya manda la lección", () => {
    const r = alternativasParaPracticar(CATALOGO, opciones);
    expect(r.map((s) => s.slug)).not.toContain("la-del-curso");
  });

  it("solo propone canciones que entrenan lo mismo", () => {
    const r = alternativasParaPracticar(CATALOGO, opciones);
    expect(r.map((s) => s.slug)).not.toContain("otra-cosa");
  });

  it("no propone nada por encima del techo del módulo", () => {
    const r = alternativasParaPracticar(CATALOGO, opciones);
    expect(r.map((s) => s.slug)).not.toContain("demasiado-dificil");
  });

  it("primero la que comparte más técnicas", () => {
    const r = alternativasParaPracticar(CATALOGO, opciones);
    expect(r[0].slug).toBe("dos-tecnicas");
  });

  it("a igualdad de técnicas, gana la del mismo estilo", () => {
    const catalogo = [
      cancion("otro-genero", 2, ["palm-mute"], "jazz"),
      cancion("mismo-genero", 2, ["palm-mute"], "punk"),
    ];
    const r = alternativasParaPracticar(catalogo, {
      tecnicas: ["palm-mute"],
      nivelMaximo: 3,
      excluir: "x",
      estilo: "punk",
    });
    expect(r[0].slug).toBe("mismo-genero");
  });

  it("devuelve como mucho las que se piden", () => {
    expect(alternativasParaPracticar(CATALOGO, { ...opciones, cuantas: 2 })).toHaveLength(
      2,
    );
  });

  it("sin técnicas no inventa alternativas", () => {
    expect(alternativasParaPracticar(CATALOGO, { ...opciones, tecnicas: [] })).toEqual(
      [],
    );
  });
});

describe("enlaceDeCatalogo", () => {
  it("lleva al catálogo filtrado por lo que se practica", () => {
    expect(enlaceDeCatalogo(["palm-mute", "pua-alterna"], 3)).toBe(
      "/canciones?nivel=1%2C2%2C3&tecnica=palm-mute%2Cpua-alterna",
    );
  });

  it("sin técnicas, al catálogo entero por nivel", () => {
    expect(enlaceDeCatalogo([], 2)).toBe("/canciones?nivel=1%2C2");
  });
});
