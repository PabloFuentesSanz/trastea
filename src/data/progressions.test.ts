import { describe, expect, it } from "vitest";
import { PROGRESSIONS, getProgression } from "./progressions";
import { parseGrid, validateGrid } from "@/lib/music/grid";
import { transposeGrid } from "@/lib/music/transpose";
import { PRACTICAL_ROOTS } from "@/lib/music/notes";

describe("PROGRESSIONS", () => {
  it("no repite ids", () => {
    const ids = PROGRESSIONS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("todos los cifrados existen", () => {
    for (const p of PROGRESSIONS) {
      expect(() => validateGrid(p.grid), p.id).not.toThrow();
    }
  });

  it("todas se pueden llevar a los doce tonos sin romperse", () => {
    for (const p of PROGRESSIONS) {
      for (const tono of PRACTICAL_ROOTS) {
        const rejilla = transposeGrid(p.grid, p.key, tono);
        expect(() => validateGrid(rejilla), `${p.id} en ${tono}`).not.toThrow();
        // y conserva el número de compases
        expect(parseGrid(rejilla).length, `${p.id} en ${tono}`).toBe(
          parseGrid(p.grid).length,
        );
      }
    }
  });

  it("el blues básico no es el de quick change", () => {
    const basico = getProgression("blues-12")!;
    const quick = getProgression("blues-quick-change")!;
    expect(basico.grid).not.toBe(quick.grid);
    // el quick change mete el IV en el compás 2
    expect(parseGrid(quick.grid)[1].chords[0]).toBe("D7");
    expect(parseGrid(basico.grid)[1].chords[0]).toBe("A7");
  });

  it("los blues de 12 tienen doce compases", () => {
    for (const p of PROGRESSIONS.filter((x) => x.id.startsWith("blues"))) {
      expect(parseGrid(p.grid).length, p.id).toBe(12);
    }
  });
});
