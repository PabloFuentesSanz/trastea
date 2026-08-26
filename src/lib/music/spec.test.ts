import { describe, expect, it } from "vitest";
import {
  parseChordSymbol,
  parseFormulaSpec,
  windowPositions,
  type FormulaSpec,
} from "./spec";
import { formulaPositions } from "./fretboard";
import { getTuning } from "@/data/tunings";

const STANDARD = getTuning("standard").midi;

describe("parseFormulaSpec", () => {
  it("separa raíz e id de escala", () => {
    const spec = parseFormulaSpec("A minor-pentatonic", "scale");
    expect(spec.root).toBe("A");
    expect(spec.id).toBe("minor-pentatonic");
    expect(spec.intervals).toEqual(["1", "b3", "4", "5", "b7"]);
  });

  it("acepta raíces con alteración", () => {
    expect(parseFormulaSpec("Bb major", "scale").root).toBe("Bb");
    expect(parseFormulaSpec("F# natural-minor", "scale").root).toBe("F#");
  });

  it("resuelve acordes por id", () => {
    const spec = parseFormulaSpec("C maj7", "chord");
    expect(spec.root).toBe("C");
    expect(spec.intervals).toEqual(["1", "3", "5", "7"]);
  });

  it("resuelve acordes por cifrado americano, sin espacio", () => {
    const spec = parseFormulaSpec("Am7", "chord");
    expect(spec.root).toBe("A");
    expect(spec.intervals).toEqual(["1", "b3", "5", "b7"]);
  });

  it("etiqueta en castellano para el aria-label", () => {
    expect(parseFormulaSpec("A minor-pentatonic", "scale").label).toContain(
      "pentatónica",
    );
    expect(parseFormulaSpec("A minor-pentatonic", "scale").label).toContain("La");
  });

  it("falla con id desconocido en vez de dibujar cualquier cosa", () => {
    expect(() => parseFormulaSpec("A no-existe", "scale")).toThrow(/no-existe/);
  });

  it("falla con raíz inválida", () => {
    expect(() => parseFormulaSpec("H major", "scale")).toThrow();
  });
});

describe("parseChordSymbol", () => {
  it("tríada mayor sin sufijo", () => {
    expect(parseChordSymbol("C")).toEqual({ root: "C", id: "major" });
  });

  it("prefiere el sufijo más largo: maj7 no es m + aj7", () => {
    expect(parseChordSymbol("Cmaj7")).toEqual({ root: "C", id: "maj7" });
  });

  it("distingue Cm de C", () => {
    expect(parseChordSymbol("Cm")).toEqual({ root: "C", id: "minor" });
  });

  it("semidisminuido", () => {
    expect(parseChordSymbol("Bm7b5")).toEqual({ root: "B", id: "m7b5" });
  });

  it("raíz con bemol", () => {
    expect(parseChordSymbol("Bb7")).toEqual({ root: "Bb", id: "7" });
  });

  it("devuelve null si el sufijo no existe", () => {
    expect(parseChordSymbol("Czzz")).toBeNull();
  });
});

describe("windowPositions", () => {
  const all = formulaPositions({
    root: "A",
    intervals: ["1", "b3", "4", "5", "b7"],
    tuningMidi: STANDARD,
    frets: 15,
  });

  it("recorta a la ventana de trastes, inclusive", () => {
    const box = windowPositions(all, { fromFret: 5, toFret: 8 });
    expect(box.length).toBeGreaterThan(0);
    for (const p of box) {
      expect(p.fret).toBeGreaterThanOrEqual(5);
      expect(p.fret).toBeLessThanOrEqual(8);
    }
  });

  it("la caja 1 de la pentatónica de La son 12 notas", () => {
    // dos por cuerda, seis cuerdas: el dibujo clásico del traste 5
    expect(windowPositions(all, { fromFret: 5, toFret: 8 })).toHaveLength(12);
  });

  it("filtra por cuerdas en numeración musical (6 = Mi grave)", () => {
    const top = windowPositions(all, { fromFret: 5, toFret: 8, strings: [1, 2, 3] });
    // índice 5 = 1ª cuerda, 4 = 2ª, 3 = 3ª
    expect(new Set(top.map((p) => p.string))).toEqual(new Set([3, 4, 5]));
  });

  it("sin ventana devuelve todo tal cual", () => {
    expect(windowPositions(all, {})).toHaveLength(all.length);
  });

  it("incluye las cuerdas al aire cuando la ventana empieza en 0", () => {
    const open = windowPositions(all, { fromFret: 0, toFret: 3 });
    expect(open.some((p) => p.fret === 0)).toBe(true);
  });
});

describe("FormulaSpec como contrato de autoría", () => {
  it("un spec basta para dibujar: raíz, intervalos y etiqueta", () => {
    const spec: FormulaSpec = parseFormulaSpec("G dorian", "scale");
    expect(spec).toMatchObject({ root: "G", id: "dorian" });
    expect(typeof spec.label).toBe("string");
    expect(spec.intervals.length).toBeGreaterThan(0);
  });
});
