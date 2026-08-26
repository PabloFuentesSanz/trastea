import { describe, expect, it } from "vitest";
import { parseFretSpec, voicingFromFrets } from "./voicing-from-frets";
import { getTuning } from "@/data/tunings";

const STANDARD = getTuning("standard").midi;

describe("parseFretSpec", () => {
  it("lee una digitación de seis valores, de 6ª a 1ª", () => {
    expect(parseFretSpec("3,2,0,0,0,3")).toEqual([3, 2, 0, 0, 0, 3]);
  });

  it("acepta x, X y guion como cuerda muteada", () => {
    expect(parseFretSpec("x,3,2,0,1,X")).toEqual([null, 3, 2, 0, 1, null]);
    expect(parseFretSpec("-,3,2,0,1,-")).toEqual([null, 3, 2, 0, 1, null]);
  });

  it("acepta espacios en vez de comas", () => {
    expect(parseFretSpec("3 x 3 4 x x")).toEqual([3, null, 3, 4, null, null]);
  });

  it("exige seis cuerdas", () => {
    expect(() => parseFretSpec("3,2,0")).toThrow(/6 valores/);
  });

  it("rechaza trastes imposibles", () => {
    expect(() => parseFretSpec("3,2,0,0,0,99")).toThrow(/Traste inválido/);
    expect(() => parseFretSpec("3,2,0,0,0,hola")).toThrow(/Traste inválido/);
  });
});

describe("voicingFromFrets", () => {
  const g7shell = () =>
    voicingFromFrets({
      root: "G",
      intervals: ["1", "3", "5", "b7"],
      frets: parseFretSpec("3,x,3,4,x,x"),
      tuningMidi: STANDARD,
    });

  it("un shell de G7 suena en tres cuerdas y salta la 5ª", () => {
    const v = g7shell();
    expect(v.soundingStrings).toBe(3);
    expect(v.frets[1]).toBeNull();
  });

  it("identifica el intervalo de cada cuerda sonante", () => {
    // 6ª/3 = Sol (1), 4ª/3 = Fa (b7), 3ª/4 = Si (3)
    expect(g7shell().intervals).toEqual(["1", null, "b7", "3", null, null]);
  });

  it("el traste base es el pisado más grave, ignorando los aires", () => {
    expect(g7shell().baseFret).toBe(3);
    const abierto = voicingFromFrets({
      root: "C",
      intervals: ["1", "3", "5"],
      frets: parseFretSpec("x,3,2,0,1,0"),
      tuningMidi: STANDARD,
    });
    expect(abierto.baseFret).toBe(1);
    expect(abierto.usesOpenStrings).toBe(true);
  });

  it("la inversión sale del bajo que suena", () => {
    // C mayor abierto: el bajo es Do, fundamental
    const fundamental = voicingFromFrets({
      root: "C",
      intervals: ["1", "3", "5"],
      frets: parseFretSpec("x,3,2,0,1,0"),
      tuningMidi: STANDARD,
    });
    expect(fundamental.inversion).toBe(0);

    // con Mi en el bajo, primera inversión
    const primera = voicingFromFrets({
      root: "C",
      intervals: ["1", "3", "5"],
      frets: parseFretSpec("0,3,2,0,1,0"),
      tuningMidi: STANDARD,
    });
    expect(primera.inversion).toBe(1);
  });

  it("detecta la cejilla cuando tres cuerdas comparten el traste base", () => {
    // F mayor con cejilla en el 1
    const f = voicingFromFrets({
      root: "F",
      intervals: ["1", "3", "5"],
      frets: parseFretSpec("1,3,3,2,1,1"),
      tuningMidi: STANDARD,
    });
    expect(f.isBarre).toBe(true);
    expect(g7shell().isBarre).toBe(false);
  });

  it("una nota ajena al acorde queda sin intervalo, no inventa uno", () => {
    const v = voicingFromFrets({
      root: "C",
      intervals: ["1", "3", "5"],
      frets: parseFretSpec("x,3,2,0,1,1"),
      tuningMidi: STANDARD,
    });
    // 1ª cuerda traste 1 = Fa, que no está en Do mayor
    expect(v.intervals[5]).toBeNull();
  });
});
