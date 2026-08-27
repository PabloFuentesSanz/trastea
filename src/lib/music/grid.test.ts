import { describe, expect, it } from "vitest";
import { gridChords, parseGrid, validateGrid } from "./grid";

describe("parseGrid", () => {
  it("parte por compases", () => {
    expect(parseGrid("A7 | D7 | A7 | E7")).toEqual([
      { chords: ["A7"] },
      { chords: ["D7"] },
      { chords: ["A7"] },
      { chords: ["E7"] },
    ]);
  });

  it("admite dos acordes en un compás", () => {
    expect(parseGrid("Cm7 F7 | Bbmaj7")).toEqual([
      { chords: ["Cm7", "F7"] },
      { chords: ["Bbmaj7"] },
    ]);
  });

  it('"%" repite el compás anterior', () => {
    expect(parseGrid("A7 | % | %")).toEqual([
      { chords: ["A7"] },
      { chords: [] },
      { chords: [] },
    ]);
  });

  it("tolera espacios y barras de más", () => {
    expect(parseGrid("  A7  |  D7  |  ")).toHaveLength(2);
  });

  it("rechaza una rejilla vacía", () => {
    expect(() => parseGrid("   ")).toThrow(/vacía/);
  });

  it('rechaza "%" en el primer compás', () => {
    expect(() => parseGrid("% | A7")).toThrow(/primer compás/);
  });
});

describe("gridChords", () => {
  it("lista los cifrados sin repetir", () => {
    expect(gridChords(parseGrid("A7 | A7 | D7 | A7"))).toEqual(["A7", "D7"]);
  });

  it("ignora los compases de repetición", () => {
    expect(gridChords(parseGrid("A7 | %"))).toEqual(["A7"]);
  });
});

describe("validateGrid", () => {
  it("acepta una forma de blues real", () => {
    expect(() =>
      validateGrid("A7 | A7 | A7 | A7 | D7 | D7 | A7 | A7 | E7 | D7 | A7 | E7"),
    ).not.toThrow();
  });

  it("acepta un blues de jazz con ii-V", () => {
    expect(() => validateGrid("F7 | Bb7 | F7 | Cm7 F7")).not.toThrow();
  });

  it("revienta con un cifrado inventado", () => {
    expect(() => validateGrid("A7 | Xyz9")).toThrow();
  });
});
