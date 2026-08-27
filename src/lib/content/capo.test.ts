import { describe, expect, it } from "vitest";
import { capoCoherence, shapeRoot, soundingKey } from "./capo";

describe("soundingKey", () => {
  it("sin capo, lo que suena es lo que tocas", () => {
    expect(soundingKey("C", 0)).toBe("C");
    expect(soundingKey("Am", undefined)).toBe("Am");
  });

  it("sube tantos semitonos como trastes tenga el capo", () => {
    expect(soundingKey("C", 3)).toBe("Eb");
    expect(soundingKey("G", 4)).toBe("B");
    expect(soundingKey("E", 2)).toBe("F#");
  });

  it("conserva el modo menor", () => {
    expect(soundingKey("Am", 4)).toBe("C#m");
    expect(soundingKey("Em", 3)).toBe("Gm");
  });

  it("elige la escritura que se usa de verdad, no la enarmónica rara", () => {
    // capo 3 sobre Do da Mib, no Re#
    expect(soundingKey("C", 3)).toBe("Eb");
    // capo 1 sobre Mi da Fa, no Mi#
    expect(soundingKey("E", 1)).toBe("F");
  });

  it("da la vuelta entera a los doce trastes", () => {
    expect(soundingKey("C", 12)).toBe("C");
  });
});

describe("shapeRoot", () => {
  it("se queda con la raíz y el modo, sin extensiones", () => {
    expect(shapeRoot("Cadd9")).toBe("C");
    expect(shapeRoot("Em7")).toBe("Em");
    expect(shapeRoot("A7sus4")).toBe("A");
    expect(shapeRoot("Dsus4")).toBe("D");
  });

  it("no toca lo que no entiende", () => {
    expect(shapeRoot("???")).toBe("???");
  });
});

describe("capoCoherence", () => {
  it("sin capo no hay nada que comprobar", () => {
    expect(capoCoherence({ key: "C", chords: ["C", "G"], capo: 0 })).toBeNull();
    expect(capoCoherence({ key: "C", chords: ["C", "G"] })).toBeNull();
  });

  it("sin acordes declarados tampoco se puede decidir", () => {
    expect(capoCoherence({ key: "A", chords: [], capo: 7 })).toBeNull();
  });

  it("delata la ficha en la que `key` es la forma y no lo que suena", () => {
    // Landslide: formas de Do con capo 3 suenan en Mib, no en Do
    const fallo = capoCoherence({ key: "C", chords: ["C", "G", "Am", "D"], capo: 3 });
    expect(fallo).not.toBeNull();
    expect(fallo?.esperado).toBe("Eb");
    expect(fallo?.forma).toBe("C");
  });

  it("acepta la ficha bien escrita: key es lo que suena", () => {
    expect(
      capoCoherence({ key: "Eb", chords: ["C", "G", "Am", "D"], capo: 3 }),
    ).toBeNull();
  });

  it("también vale en menor", () => {
    expect(capoCoherence({ key: "C#m", chords: ["Am", "C", "G"], capo: 4 })).toBeNull();
    expect(
      capoCoherence({ key: "Am", chords: ["Am", "C", "G"], capo: 4 }),
    ).not.toBeNull();
  });

  it("compara raíz y modo, no el cifrado entero", () => {
    // Wonderwall: formas de Em7 con capo 2 suenan en Fa# menor
    expect(
      capoCoherence({ key: "F#m", chords: ["Em7", "G", "Cadd9"], capo: 2 }),
    ).toBeNull();
    // pero un mayor donde debería haber menor sí es un fallo
    expect(capoCoherence({ key: "F#", chords: ["Em7", "G"], capo: 2 })).not.toBeNull();
  });

  it("acepta la enarmonía correcta escrita de otra forma", () => {
    // Dom sostenido menor y Reb menor son la misma tonalidad
    expect(capoCoherence({ key: "Dbm", chords: ["Am", "C"], capo: 4 })).toBeNull();
  });

  it("no se cree un acorde que no sabe leer", () => {
    expect(capoCoherence({ key: "C", chords: ["???"], capo: 3 })).toBeNull();
  });

  it("el primer acorde manda: es la tónica de las formas", () => {
    // formas de Sol con capo 4 → suena en Si
    const fallo = capoCoherence({ key: "G", chords: ["G", "D", "Em", "C"], capo: 4 });
    expect(fallo?.esperado).toBe("B");
  });
});
