import { describe, expect, it } from "vitest";
import {
  parseChordSymbol,
  parseFormulaSpec,
  notesThatArent,
  parseNoteSpec,
  positionsFromNotes,
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

describe("parseNoteSpec", () => {
  it("lee pares cuerda:traste en numeración musical", () => {
    expect(parseNoteSpec("6:5, 5:7")).toEqual([
      { string: 6, fret: 5 },
      { string: 7 - 2, fret: 7 },
    ]);
  });

  it("acepta el traste 0 (cuerda al aire)", () => {
    expect(parseNoteSpec("6:0")).toEqual([{ string: 6, fret: 0 }]);
  });

  it("rechaza cuerdas fuera de la guitarra", () => {
    expect(() => parseNoteSpec("7:5")).toThrow(/cuerda/i);
    expect(() => parseNoteSpec("0:5")).toThrow(/cuerda/i);
  });

  it("rechaza basura", () => {
    expect(() => parseNoteSpec("6-5")).toThrow();
    expect(() => parseNoteSpec("6:xx")).toThrow();
  });
});

describe("positionsFromNotes", () => {
  it("nombra los intervalos respecto a la primera nota", () => {
    // 5ª cuerda traste 3 = Do; 4ª cuerda traste 2 = Mi → 3ª mayor
    const pos = positionsFromNotes(parseNoteSpec("5:3, 4:2"), STANDARD);
    expect(pos.map((p) => p.interval)).toEqual(["1", "3"]);
    expect(pos.map((p) => p.note)).toEqual(["C", "E"]);
    expect(pos[0].isRoot).toBe(true);
    expect(pos[1].isRoot).toBe(false);
  });

  it("la quinta justa del power chord", () => {
    const pos = positionsFromNotes(parseNoteSpec("5:3, 4:5"), STANDARD);
    expect(pos.map((p) => p.interval)).toEqual(["1", "5"]);
  });

  it("la octava sale como 1, no como 8", () => {
    const pos = positionsFromNotes(parseNoteSpec("6:5, 4:7"), STANDARD);
    expect(pos.map((p) => p.interval)).toEqual(["1", "1"]);
    expect(pos[1].isRoot).toBe(true);
  });

  it("acepta una raíz explícita distinta de la primera nota", () => {
    // mismas notas, pero midiendo desde La
    const pos = positionsFromNotes(parseNoteSpec("5:3, 4:2"), STANDARD, "A");
    expect(pos.map((p) => p.interval)).toEqual(["b3", "5"]);
  });

  it("convierte a índice interno de cuerda (6ª = 0)", () => {
    expect(positionsFromNotes(parseNoteSpec("6:5"), STANDARD)[0].string).toBe(0);
    expect(positionsFromNotes(parseNoteSpec("1:5"), STANDARD)[0].string).toBe(5);
  });
});

describe("notesThatArent", () => {
  const STANDARD = getTuning("standard").midi;

  it("no encuentra nada en un mapa de octavas correcto", () => {
    // los seis Soles del mástil
    expect(
      notesThatArent(parseNoteSpec("6:3, 5:10, 4:5, 3:0, 2:8, 1:3"), STANDARD, "G"),
    ).toEqual([]);
  });

  it("señala la posición que no es esa nota", () => {
    // 3ª cuerda traste 2 es un La, no un Re
    expect(notesThatArent(parseNoteSpec("4:0, 3:2"), STANDARD, "D")).toEqual(["3:2"]);
  });

  it("acepta la misma nota en dos octavas distintas", () => {
    expect(notesThatArent(parseNoteSpec("3:0, 3:12"), STANDARD, "G")).toEqual([]);
  });
});
