import { describe, expect, it } from "vitest";
import { parseStrumPattern, strumNotes, strumPatternLabel } from "./strum";

describe("parseStrumPattern", () => {
  it("lee flechas: abajo, arriba y hueco, una por corchea", () => {
    expect(parseStrumPattern("↓ · ↓↑ · ↑ ↓↑")).toEqual([
      { beat: 0, direction: "abajo" },
      { beat: 1, direction: "abajo" },
      { beat: 1.5, direction: "arriba" },
      { beat: 2.5, direction: "arriba" },
      { beat: 3, direction: "abajo" },
      { beat: 3.5, direction: "arriba" },
    ]);
  });

  it("acepta la notación con letras D/U y guiones", () => {
    expect(parseStrumPattern("D - D U - U D U")).toEqual(
      parseStrumPattern("↓ · ↓↑ · ↑ ↓↑"),
    );
  });

  it("la equis es un golpe apagado (percusivo, sin altura)", () => {
    expect(parseStrumPattern("↓ · x · ↓ · x ·")).toEqual([
      { beat: 0, direction: "abajo" },
      { beat: 1, direction: "apagado" },
      { beat: 2, direction: "abajo" },
      { beat: 3, direction: "apagado" },
    ]);
  });

  it("un patrón tiene exactamente ocho corcheas: menos o más es un error de escritura", () => {
    expect(() => parseStrumPattern("↓ ↓ ↓")).toThrow(/ocho/);
    expect(() => parseStrumPattern("↓↑ ↓↑ ↓↑ ↓↑ ↓↑")).toThrow(/ocho/);
  });

  it("una corchea del pulso solo puede ir hacia abajo y la del 'y' hacia arriba, si van juntas", () => {
    // "↑↓" en una misma casilla estaría al revés de como se mueve la mano
    expect(() => parseStrumPattern("↑↓ · · ·")).toThrow(/mano/);
  });
});

describe("strumNotes", () => {
  it("cada golpe rasguea el acorde entero con el orden de la mano", () => {
    const notes = strumNotes("↓ · ↓↑ · ↑ ↓↑", ["Em"], { bars: 1 });
    const golpes = new Set(notes.map((n) => n.beat));
    expect([...golpes].sort((a, b) => a - b)).toEqual([0, 1, 1.5, 2.5, 3, 3.5]);
    const abajo = notes.filter((n) => n.beat === 0).sort((a, b) => a.midi - b.midi);
    expect(abajo.map((n) => n.strumIndex)).toEqual(abajo.map((_, i) => i));
    const arriba = notes.filter((n) => n.beat === 1.5).sort((a, b) => b.midi - a.midi);
    expect(arriba.map((n) => n.strumIndex)).toEqual(arriba.map((_, i) => i));
  });

  it("un golpe apagado es una nota muerta, no un acorde", () => {
    const notes = strumNotes("↓ · x · ↓ · x ·", ["Em"], { bars: 1 });
    expect(notes.filter((n) => n.voice === "muerta")).toHaveLength(2);
  });

  it("con varios acordes, un compás por acorde", () => {
    const notes = strumNotes("↓ · ↓↑ · ↑ ↓↑", ["Em", "C"], {});
    expect(Math.max(...notes.map((n) => n.beat))).toBeGreaterThanOrEqual(4);
    expect(notes.every((n) => n.beat < 8)).toBe(true);
  });

  it("el golpe abajo pega más fuerte que el arriba, que es como suena una mano de verdad", () => {
    const notes = strumNotes("↓ · ↓↑ · ↑ ↓↑", ["Em"], { bars: 1 });
    const abajo = notes.find((n) => n.beat === 0)!;
    const arriba = notes.find((n) => n.beat === 1.5)!;
    expect(abajo.velocity).toBeGreaterThan(arriba.velocity);
  });
});

describe("strumPatternLabel", () => {
  it("se lee en voz alta como se cuenta", () => {
    expect(strumPatternLabel("↓ · ↓↑ · ↑ ↓↑")).toBe(
      "1 abajo, 2 abajo, y arriba, y arriba, 4 abajo, y arriba",
    );
  });
});
