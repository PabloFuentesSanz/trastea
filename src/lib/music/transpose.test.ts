import { describe, expect, it } from "vitest";
import { cycleKeys, transposeChord, transposeGrid } from "./transpose";
import { PRACTICAL_ROOTS } from "./notes";

describe("transposeChord", () => {
  it("mueve la fundamental y respeta la cualidad", () => {
    expect(transposeChord("Cmaj7", "C", "D")).toBe("Dmaj7");
    expect(transposeChord("Dm7", "C", "F")).toBe("Gm7");
    expect(transposeChord("G7", "C", "F")).toBe("C7");
  });

  it("no toca nada si el tono no cambia", () => {
    for (const cifrado of ["Cmaj7", "Am7b5", "F#m7", "Bb7", "Esus4"]) {
      expect(transposeChord(cifrado, "C", "C")).toBe(cifrado);
    }
  });

  it("conserva la escritura de la tonalidad de destino", () => {
    // el IV de Fa es Sib, no La#
    expect(transposeChord("F", "C", "F")).toBe("Bb");
    // el V de Mi es Si, y su IV es La
    expect(transposeChord("G", "C", "E")).toBe("B");
  });

  it("deletrea bien los acordes cromáticos, no solo los del tono", () => {
    // el bII7 de Re es Mib7 aunque Re prefiera sostenidos
    expect(transposeChord("Db7", "C", "D")).toBe("Eb7");
    // y el bVI de Mi es Do, no Si#
    expect(transposeChord("Ab", "C", "E")).toBe("C");
  });

  it("mantiene cualidades con alteraciones dentro", () => {
    expect(transposeChord("Am7b5", "C", "Eb")).toBe("Cm7b5");
    expect(transposeChord("C7#9", "C", "D")).toBe("D7#9");
  });

  it("transporta también el bajo de un slash chord", () => {
    expect(transposeChord("C/E", "C", "F")).toBe("F/A");
  });

  it("deja el cifrado como está si no lo entiende", () => {
    expect(transposeChord("N.C.", "C", "D")).toBe("N.C.");
  });
});

describe("transposeGrid", () => {
  it("transporta la rejilla entera conservando su forma", () => {
    expect(transposeGrid("Dm7 | G7 | Cmaj7 | %", "C", "F")).toBe("Gm7 | C7 | Fmaj7 | %");
  });

  it("transporta los dos acordes de un mismo compás", () => {
    expect(transposeGrid("Cmaj7 | Dm7 G7", "C", "D")).toBe("Dmaj7 | Em7 A7");
  });

  it("un blues en Fa llevado a Sol sigue siendo un blues", () => {
    expect(transposeGrid("F7 | Bb7 | F7 | C7", "F", "G")).toBe("G7 | C7 | G7 | D7");
  });

  it("los doce tonos de un ii-V-I siguen siendo ii-V-I", () => {
    const tonos = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
    for (const tono of tonos) {
      const rejilla = transposeGrid("Dm7 | G7 | Cmaj7", "C", tono);
      const [ii, v, i] = rejilla.split(" | ");
      expect(i).toBe(`${tono}maj7`);
      expect(ii.endsWith("m7")).toBe(true);
      expect(v.endsWith("7")).toBe(true);
    }
  });
});

describe("cycleKeys", () => {
  it("baja de cuarta en cuarta y vuelve al principio en doce", () => {
    const ciclo = cycleKeys("C", 12);
    expect(ciclo[0]).toBe("C");
    expect(ciclo[1]).toBe("F");
    expect(ciclo[2]).toBe("Bb");
    expect(ciclo).toHaveLength(12);
    expect(new Set(ciclo).size).toBe(12);
  });

  it("deletrea con bemoles, salvo donde la app usa la otra enarmonía", () => {
    // el selector de tono ofrece F#, no Gb: el ciclo usa la misma lista
    expect(cycleKeys("C", 7)).toEqual(["C", "F", "Bb", "Eb", "Ab", "Db", "F#"]);
  });

  it("arranca donde se le diga", () => {
    expect(cycleKeys("G", 3)).toEqual(["G", "C", "F"]);
  });

  it("puede subir por semitonos en vez de por cuartas", () => {
    expect(cycleKeys("C", 4, "semitono")).toEqual(["C", "Db", "D", "Eb"]);
  });

  it("se queda en las tonalidades prácticas", () => {
    for (const tono of cycleKeys("B", 12)) {
      expect(PRACTICAL_ROOTS).toContain(tono);
    }
  });
});
