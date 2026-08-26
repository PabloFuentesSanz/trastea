import { describe, expect, it } from "vitest";
import { generateTriadVoicings, generateVoicings } from "./voicings";
import { CHORDS } from "@/data/chords";
import { TUNINGS } from "@/data/tunings";

const standard = TUNINGS.standard.midi;

const base = {
  tuningMidi: standard,
  intervals: CHORDS.major.intervals,
};

function findShape(
  voicings: { frets: (number | null)[] }[],
  shape: (number | null)[],
): boolean {
  const key = shape.join(",");
  return voicings.some((v) => v.frets.join(",") === key);
}

describe("generateVoicings — formas clásicas presentes", () => {
  it("encuentra el Do mayor abierto (x32010)", () => {
    const voicings = generateVoicings({ ...base, root: "C" });
    expect(findShape(voicings, [null, 3, 2, 0, 1, 0])).toBe(true);
  });

  it("encuentra el Mi mayor abierto (022100)", () => {
    const voicings = generateVoicings({ ...base, root: "E" });
    expect(findShape(voicings, [0, 2, 2, 1, 0, 0])).toBe(true);
  });

  it("encuentra el Fa con cejilla (133211) y lo marca como cejilla", () => {
    const voicings = generateVoicings({ ...base, root: "F" });
    const barre = voicings.find((v) => v.frets.join(",") === "1,3,3,2,1,1");
    expect(barre).toBeDefined();
    expect(barre?.isBarre).toBe(true);
    expect(barre?.inversion).toBe(0);
  });

  it("encuentra la forma A de Do (cejilla en traste 3, x35553)", () => {
    const voicings = generateVoicings({ ...base, root: "C" });
    expect(findShape(voicings, [null, 3, 5, 5, 5, 3])).toBe(true);
  });

  it("encuentra el Sol mayor abierto (320003 o 320033)", () => {
    const voicings = generateVoicings({ ...base, root: "G" });
    expect(
      findShape(voicings, [3, 2, 0, 0, 0, 3]) || findShape(voicings, [3, 2, 0, 0, 3, 3]),
    ).toBe(true);
  });
});

describe("generateVoicings — invariantes", () => {
  const voicings = generateVoicings({ ...base, root: "A" });

  it("toda forma suena solo notas del acorde", () => {
    for (const v of voicings) {
      for (const interval of v.intervals) {
        if (interval !== null) {
          expect(CHORDS.major.intervals).toContain(interval);
        }
      }
    }
  });

  it("toda forma cubre la fórmula completa (tríada sin omisiones)", () => {
    for (const v of voicings) {
      const sounded = new Set(v.intervals.filter((i) => i !== null));
      expect(sounded).toEqual(new Set(CHORDS.major.intervals));
    }
  });

  it("las cuerdas sonantes son contiguas y ≥4 por defecto", () => {
    for (const v of voicings) {
      const idx = v.frets.map((f, i) => (f !== null ? i : -1)).filter((i) => i >= 0);
      expect(idx[idx.length - 1] - idx[0]).toBe(idx.length - 1);
      expect(v.soundingStrings).toBeGreaterThanOrEqual(4);
    }
  });

  it("el span de trastes pisados nunca supera 3", () => {
    for (const v of voicings) {
      const fretted = v.frets.filter((f): f is number => f !== null && f > 0);
      if (fretted.length > 0) {
        expect(Math.max(...fretted) - Math.min(...fretted)).toBeLessThanOrEqual(3);
      }
    }
  });

  it("no hay formas duplicadas", () => {
    const keys = voicings.map((v) => v.frets.join(","));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("hay formas a lo largo de todo el mástil (CAGED)", () => {
    const baseFrets = new Set(voicings.map((v) => v.baseFret));
    // al menos 5 zonas distintas del diapasón
    expect(baseFrets.size).toBeGreaterThanOrEqual(5);
  });
});

describe("generateVoicings — acordes de séptima", () => {
  it("encuentra el G7 abierto (320001)", () => {
    const voicings = generateVoicings({
      ...base,
      intervals: CHORDS["7"].intervals,
      root: "G",
    });
    expect(findShape(voicings, [3, 2, 0, 0, 0, 1])).toBe(true);
  });

  it("permite omitir la 5ª en un maj7 pero nunca la 3ª ni la 7ª", () => {
    const voicings = generateVoicings({
      ...base,
      intervals: CHORDS.maj7.intervals,
      root: "C",
    });
    expect(voicings.length).toBeGreaterThan(0);
    for (const v of voicings) {
      const sounded = new Set(v.intervals.filter((i) => i !== null));
      expect(sounded.has("1")).toBe(true);
      expect(sounded.has("3")).toBe(true);
      expect(sounded.has("7")).toBe(true);
    }
  });
});

describe("generateTriadVoicings", () => {
  it("genera tríadas de 3 cuerdas contiguas con inversiones", () => {
    const triads = generateTriadVoicings({ ...base, root: "C" });
    expect(triads.length).toBeGreaterThan(10);
    const inversions = new Set(triads.map((t) => t.inversion));
    expect(inversions).toEqual(new Set([0, 1, 2]));
    for (const t of triads) {
      expect(t.soundingStrings).toBe(3);
    }
  });

  it("respeta el grupo de cuerdas pedido (1-2-3 = índices 3..5)", () => {
    const triads = generateTriadVoicings({
      ...base,
      root: "G",
      stringSet: [3, 5],
    });
    for (const t of triads) {
      expect(t.frets[0]).toBeNull();
      expect(t.frets[1]).toBeNull();
      expect(t.frets[2]).toBeNull();
    }
    // La tríada de Sol en 1-2-3 en fundamental: G(t.5 3ª) B(t.3 2ª) D(t.3 1ª)? — al menos existe alguna con bajo Sol
    expect(triads.some((t) => t.inversion === 0)).toBe(true);
  });
});
