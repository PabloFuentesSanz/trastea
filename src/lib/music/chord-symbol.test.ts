import { describe, expect, it } from "vitest";
import { CHORDS } from "@/data/chords";
import { chordToolHref, parseChordSymbol } from "./chord-symbol";

describe("parseChordSymbol", () => {
  it("lee tríadas mayores y menores", () => {
    expect(parseChordSymbol("C")).toEqual({ root: "C", type: "major" });
    expect(parseChordSymbol("Am")).toEqual({ root: "A", type: "minor" });
  });

  it("lee acordes de séptima y sus variantes", () => {
    expect(parseChordSymbol("Bbmaj7")).toEqual({ root: "Bb", type: "maj7" });
    expect(parseChordSymbol("G7")).toEqual({ root: "G", type: "7" });
    expect(parseChordSymbol("Dm7")).toEqual({ root: "D", type: "m7" });
    expect(parseChordSymbol("F#m7b5")).toEqual({ root: "F#", type: "m7b5" });
  });

  it("normaliza la tónica a las que /acordes sabe dibujar", () => {
    expect(parseChordSymbol("C#m")).toEqual({ root: "Db", type: "minor" });
    expect(parseChordSymbol("G#7")).toEqual({ root: "Ab", type: "7" });
  });

  it("devuelve solo la tónica si el sufijo no está en el vocabulario", () => {
    expect(parseChordSymbol("E5")).toEqual({ root: "E", type: undefined });
    expect(parseChordSymbol("D7#9")).toEqual({ root: "D", type: undefined });
    expect(parseChordSymbol("Cadd9")).toEqual({ root: "C", type: undefined });
    expect(parseChordSymbol("A7sus4")).toEqual({ root: "A", type: undefined });
  });

  it("rechaza lo que no es un cifrado", () => {
    expect(parseChordSymbol("")).toBeNull();
    expect(parseChordSymbol("Hm")).toBeNull();
  });

  it("todo tipo que devuelve existe de verdad en /src/data/chords", () => {
    const symbols = [
      "C",
      "Am",
      "Bbmaj7",
      "G7",
      "Dm7",
      "F#m7b5",
      "Cdim7",
      "Esus4",
      "Am6",
      "C9",
    ];
    for (const symbol of symbols) {
      const type = parseChordSymbol(symbol)?.type;
      if (type) expect(CHORDS).toHaveProperty(type);
    }
  });
});

describe("chordToolHref", () => {
  it("construye el deep link completo", () => {
    expect(chordToolHref("Am7")).toBe("/acordes?root=A&type=m7");
  });

  it("omite el tipo cuando no lo conocemos, pero conserva la tónica", () => {
    expect(chordToolHref("E5")).toBe("/acordes?root=E");
  });

  it("null si no es un acorde", () => {
    expect(chordToolHref("???")).toBeNull();
  });
});
