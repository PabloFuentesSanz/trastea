import { describe, expect, it } from "vitest";
import { SCALES, getScale } from "./scales";
import { semitonesOf, spellFormula } from "@/lib/music/notes";

/** semitonos desde la raíz de cada grado de la escala */
function steps(id: string): number[] {
  return semitonesOf(getScale(id).intervals);
}

describe("catálogo de escalas", () => {
  it("cada entrada se conoce a sí misma por su clave", () => {
    for (const [key, scale] of Object.entries(SCALES)) {
      expect(scale.id).toBe(key);
    }
  });

  it("ninguna escala repite una nota ni se sale de la octava", () => {
    for (const id of Object.keys(SCALES)) {
      const s = steps(id);
      expect(new Set(s).size).toBe(s.length);
      expect(Math.min(...s)).toBe(0);
      expect(Math.max(...s)).toBeLessThan(12);
    }
  });

  it("las escalas suben: los grados van en orden", () => {
    for (const id of Object.keys(SCALES)) {
      const s = steps(id);
      expect([...s].sort((a, b) => a - b)).toEqual(s);
    }
  });

  /**
   * Vale para las diatónicas —mayor, menores y sus modos—, no para las
   * sintéticas: la alterada se escribe como la escribe el jazz (b9, #9, #11,
   * b13) porque su escritura diatónica pone un Fb justo donde el guitarrista
   * ve la tercera mayor. Ahí gana leerse bien.
   */
  it("una escala diatónica de siete notas usa las siete letras, sin repetir", () => {
    for (const [id, scale] of Object.entries(SCALES)) {
      if (scale.intervals.length !== 7 || scale.category === "sintetica") continue;
      const letras = spellFormula("C", scale.intervals).map((n) => n[0]);
      expect(new Set(letras).size, `${id} repite letra`).toBe(7);
    }
  });

  it("el padre de una escala, si lo tiene, existe", () => {
    for (const scale of Object.values(SCALES)) {
      if (scale.parent) expect(SCALES[scale.parent]).toBeDefined();
      if (scale.boxParent) expect(SCALES[scale.boxParent]).toBeDefined();
    }
  });
});

describe("escalas simétricas y alteradas", () => {
  it("la de tonos enteros son seis tonos seguidos", () => {
    expect(steps("whole-tone")).toEqual([0, 2, 4, 6, 8, 10]);
  });

  it("la disminuida tono-semitono alterna, y contiene el dim7 entero", () => {
    expect(steps("diminished-wh")).toEqual([0, 2, 3, 5, 6, 8, 9, 11]);
    for (const grado of [0, 3, 6, 9]) {
      expect(steps("diminished-wh")).toContain(grado);
    }
  });

  it("la disminuida semitono-tono es la misma rotada, y trae b9, #9 y #11", () => {
    expect(steps("diminished-hw")).toEqual([0, 1, 3, 4, 6, 7, 9, 10]);
    // sobre un dominante: 3ª mayor y b7, que es lo que la hace servir
    expect(steps("diminished-hw")).toContain(4);
    expect(steps("diminished-hw")).toContain(10);
  });

  it("la alterada tiene las cuatro tensiones alteradas y ninguna quinta justa", () => {
    const s = steps("altered");
    expect(s).toEqual([0, 1, 3, 4, 6, 8, 10]);
    expect(s).not.toContain(7);
  });

  it("la frigia dominante es la frigia con tercera mayor", () => {
    expect(steps("phrygian-dominant")).toEqual([0, 1, 4, 5, 7, 8, 10]);
  });

  it("la lidia dominante es la mixolidia con la cuarta subida", () => {
    expect(steps("lydian-dominant")).toEqual([0, 2, 4, 6, 7, 9, 10]);
  });

  it("alterada y lidia dominante son el mismo material a un tritono", () => {
    const alt = steps("altered")
      .map((s) => (s + 6) % 12)
      .sort((a, b) => a - b);
    expect(alt).toEqual(steps("lydian-dominant"));
  });

  it("se escriben con las alteraciones que dice el nombre, no por enarmonía cómoda", () => {
    expect(spellFormula("C", getScale("altered").intervals)).toEqual([
      "C",
      "Db",
      "D#",
      "E",
      "Gb",
      "G#",
      "Bb",
    ]);
    expect(spellFormula("C", getScale("whole-tone").intervals)).toEqual([
      "C",
      "D",
      "E",
      "F#",
      "G#",
      "Bb",
    ]);
  });
});
