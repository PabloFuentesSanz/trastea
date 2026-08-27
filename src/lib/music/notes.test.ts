import { describe, expect, it } from "vitest";
import {
  intervalBetween,
  keyPrefersFlats,
  mod12,
  parseInterval,
  parseNote,
  pcToName,
  spellFormula,
  toSolfege,
  transpose,
} from "./notes";
import { SCALES } from "@/data/scales";
import { CHORDS } from "@/data/chords";

describe("parseNote", () => {
  it("parsea naturales, sostenidos y bemoles", () => {
    expect(parseNote("C")).toEqual({ letter: "C", accidental: 0, pc: 0 });
    expect(parseNote("F#")).toEqual({ letter: "F", accidental: 1, pc: 6 });
    expect(parseNote("Bb")).toEqual({ letter: "B", accidental: -1, pc: 10 });
    expect(parseNote("E#")).toEqual({ letter: "E", accidental: 1, pc: 5 });
    expect(parseNote("Cb")).toEqual({ letter: "C", accidental: -1, pc: 11 });
    expect(parseNote("Fbb")).toEqual({ letter: "F", accidental: -2, pc: 3 });
  });

  it("rechaza nombres inválidos", () => {
    expect(() => parseNote("H")).toThrow();
    expect(() => parseNote("c")).toThrow();
    expect(() => parseNote("C#b")).toThrow();
  });
});

describe("parseInterval", () => {
  it("calcula semitonos de grados alterados y extensiones", () => {
    expect(parseInterval("1").semitones).toBe(0);
    expect(parseInterval("b3").semitones).toBe(3);
    expect(parseInterval("#4").semitones).toBe(6);
    expect(parseInterval("b7").semitones).toBe(10);
    expect(parseInterval("bb7").semitones).toBe(9);
    expect(parseInterval("9").semitones).toBe(14);
    expect(parseInterval("#11").semitones).toBe(18);
  });
});

describe("transpose (ortografía correcta)", () => {
  it("en Fa mayor el 4º grado es Sib, no La#", () => {
    expect(transpose("F", "4")).toBe("Bb");
  });

  it("en Fa# mayor el 7º grado es Mi#", () => {
    expect(transpose("F#", "7")).toBe("E#");
  });

  it("séptima disminuida usa doble bemol", () => {
    expect(transpose("C", "bb7")).toBe("Bbb");
  });

  it("mantiene la letra por grado", () => {
    expect(transpose("Eb", "b3")).toBe("Gb");
    expect(transpose("A", "b5")).toBe("Eb");
    expect(transpose("Db", "6")).toBe("Bb");
  });
});

describe("spellFormula con escalas reales", () => {
  it("deletrea las 12 escalas mayores sin mezclar sostenidos y bemoles", () => {
    const expected: Record<string, string[]> = {
      C: ["C", "D", "E", "F", "G", "A", "B"],
      G: ["G", "A", "B", "C", "D", "E", "F#"],
      D: ["D", "E", "F#", "G", "A", "B", "C#"],
      A: ["A", "B", "C#", "D", "E", "F#", "G#"],
      E: ["E", "F#", "G#", "A", "B", "C#", "D#"],
      B: ["B", "C#", "D#", "E", "F#", "G#", "A#"],
      "F#": ["F#", "G#", "A#", "B", "C#", "D#", "E#"],
      F: ["F", "G", "A", "Bb", "C", "D", "E"],
      Bb: ["Bb", "C", "D", "Eb", "F", "G", "A"],
      Eb: ["Eb", "F", "G", "Ab", "Bb", "C", "D"],
      Ab: ["Ab", "Bb", "C", "Db", "Eb", "F", "G"],
      Db: ["Db", "Eb", "F", "Gb", "Ab", "Bb", "C"],
    };
    for (const [root, notes] of Object.entries(expected)) {
      expect(spellFormula(root, SCALES.major.intervals)).toEqual(notes);
    }
  });

  it("deletrea la escala de blues en La", () => {
    expect(spellFormula("A", SCALES.blues.intervals)).toEqual([
      "A",
      "C",
      "D",
      "Eb",
      "E",
      "G",
    ]);
  });

  it("deletrea acordes de séptima", () => {
    expect(spellFormula("G", CHORDS.maj7.intervals)).toEqual(["G", "B", "D", "F#"]);
    expect(spellFormula("C", CHORDS["7"].intervals)).toEqual(["C", "E", "G", "Bb"]);
    expect(spellFormula("B", CHORDS.m7b5.intervals)).toEqual(["B", "D", "F", "A"]);
    expect(spellFormula("C#", CHORDS.dim7.intervals)).toEqual(["C#", "E", "G", "Bb"]);
  });
});

describe("utilidades", () => {
  it("mod12 normaliza negativos", () => {
    expect(mod12(-1)).toBe(11);
    expect(mod12(12)).toBe(0);
  });

  it("pcToName respeta la preferencia de bemoles", () => {
    expect(pcToName(10)).toBe("A#");
    expect(pcToName(10, true)).toBe("Bb");
  });

  it("keyPrefersFlats acierta con tonalidades comunes", () => {
    expect(keyPrefersFlats("F")).toBe(true);
    expect(keyPrefersFlats("Bb")).toBe(true);
    expect(keyPrefersFlats("G")).toBe(false);
    expect(keyPrefersFlats("F#")).toBe(false);
  });

  it("toSolfege traduce al sistema latino", () => {
    expect(toSolfege("Bb")).toBe("Sib");
    expect(toSolfege("F#")).toBe("Fa#");
  });
});

describe("intervalBetween", () => {
  it("deletrea el intervalo, no solo lo mide", () => {
    expect(intervalBetween("C", "E")).toBe("3");
    expect(intervalBetween("C", "Eb")).toBe("b3");
    expect(intervalBetween("C", "G")).toBe("5");
    expect(intervalBetween("C", "Db")).toBe("b2");
    expect(intervalBetween("C", "F#")).toBe("#4");
  });

  it("da la unísono para la misma nota", () => {
    expect(intervalBetween("Bb", "Bb")).toBe("1");
  });

  it("cruza la octava sin perderse", () => {
    expect(intervalBetween("B", "C")).toBe("b2");
    expect(intervalBetween("A", "G")).toBe("b7");
  });

  it("es el inverso de transpose", () => {
    for (const [desde, hasta] of [
      ["C", "Eb"],
      ["F", "Bb"],
      ["B", "F#"],
      ["Eb", "Db"],
    ] as const) {
      expect(transpose(desde, intervalBetween(desde, hasta))).toBe(hasta);
    }
  });
});
