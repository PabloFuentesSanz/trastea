import { describe, expect, it } from "vitest";
import { CHORDS, getChord } from "./chords";
import { parseChordSymbol } from "@/lib/music/spec";
import { parseInterval, semitonesOf, spellFormula } from "@/lib/music/notes";

/** semitonos desde la fundamental sin plegar la octava: la 13ª son 21, no 9 */
function steps(id: string): number[] {
  return getChord(id).intervals.map((iv) => parseInterval(iv).semitones);
}

/** las mismas notas plegadas a una octava, que es lo que suena */
function pcs(id: string): number[] {
  return semitonesOf(getChord(id).intervals);
}

describe("catálogo de acordes", () => {
  it("cada entrada se conoce a sí misma por su clave", () => {
    for (const [key, chord] of Object.entries(CHORDS)) {
      expect(chord.id).toBe(key);
    }
  });

  it("ningún acorde repite dos veces la misma nota", () => {
    for (const id of Object.keys(CHORDS)) {
      const s = pcs(id);
      expect(new Set(s).size, `${id} repite nota`).toBe(s.length);
    }
  });

  it("todos empiezan por la fundamental y suben", () => {
    for (const id of Object.keys(CHORDS)) {
      const s = steps(id);
      expect(s[0]).toBe(0);
      expect([...s].sort((a, b) => a - b)).toEqual(s);
    }
  });

  it("dos acordes distintos no comparten cifrado", () => {
    const symbols = Object.values(CHORDS).map((c) => c.symbol);
    expect(new Set(symbols).size).toBe(symbols.length);
  });

  it("todos los cifrados se vuelven a leer solos", () => {
    for (const chord of Object.values(CHORDS)) {
      expect(parseChordSymbol(`C${chord.symbol}`)?.id, chord.symbol).toBe(chord.id);
    }
  });
});

describe("dominantes alterados", () => {
  it("todos son dominantes: tercera mayor y séptima menor", () => {
    for (const id of ["7b5", "7#5", "7b9", "7#9", "13"]) {
      expect(pcs(id), id).toContain(4);
      expect(pcs(id), id).toContain(10);
    }
  });

  it("la quinta alterada sustituye a la justa, no se le suma", () => {
    expect(steps("7b5")).toEqual([0, 4, 6, 10]);
    expect(steps("7#5")).toEqual([0, 4, 8, 10]);
  });

  it("las novenas alteradas se añaden por encima de la séptima", () => {
    expect(steps("7b9")).toEqual([0, 4, 7, 10, 13]);
    expect(steps("7#9")).toEqual([0, 4, 7, 10, 15]);
  });

  it("la trecena lleva novena natural: es la de Hendrix al revés", () => {
    expect(steps("13")).toEqual([0, 4, 7, 10, 14, 21]);
  });

  it("el #9 se escribe como novena aumentada, no como tercera menor", () => {
    // en C7#9 la nota es D#, no Eb: es una novena subida, no un b3 prestado
    expect(spellFormula("C", getChord("7#9").intervals)).toContain("D#");
  });

  it("el b9 de C7b9 es Db, y el b5 de C7b5 es Gb", () => {
    expect(spellFormula("C", getChord("7b9").intervals)).toContain("Db");
    expect(spellFormula("C", getChord("7b5").intervals)).toContain("Gb");
  });
});
