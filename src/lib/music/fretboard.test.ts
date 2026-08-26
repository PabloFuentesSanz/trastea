import { describe, expect, it } from "vitest";
import { formulaMidiSequence, formulaPositions, midiAt, midiToFrequency } from "./fretboard";
import { SCALES } from "@/data/scales";
import { CHORDS } from "@/data/chords";
import { TUNINGS } from "@/data/tunings";

const standard = TUNINGS.standard.midi;

describe("midiAt", () => {
  it("calcula notas de la afinación estándar", () => {
    expect(midiAt(standard, 0, 0)).toBe(40); // E2
    expect(midiAt(standard, 0, 5)).toBe(45); // A2 = 5ª al aire
    expect(midiAt(standard, 5, 12)).toBe(76); // E5
  });

  it("rechaza cuerdas y trastes inválidos", () => {
    expect(() => midiAt(standard, 6, 0)).toThrow();
    expect(() => midiAt(standard, 0, -1)).toThrow();
  });
});

describe("midiToFrequency", () => {
  it("A4 = 440 Hz y octavas", () => {
    expect(midiToFrequency(69)).toBe(440);
    expect(midiToFrequency(57)).toBeCloseTo(220);
  });
});

describe("formulaPositions", () => {
  it("marca las raíces de Sol en la 6ª cuerda (trastes 3 y 15)", () => {
    const positions = formulaPositions({
      root: "G",
      intervals: SCALES.major.intervals,
      tuningMidi: standard,
      frets: 15,
    });
    const roots6 = positions.filter((p) => p.string === 0 && p.isRoot);
    expect(roots6.map((p) => p.fret)).toEqual([3, 15]);
  });

  it("deletrea Sib (no La#) en Fa mayor", () => {
    const positions = formulaPositions({
      root: "F",
      intervals: SCALES.major.intervals,
      tuningMidi: standard,
      frets: 12,
    });
    const fourth = positions.find((p) => p.interval === "4");
    expect(fourth?.note).toBe("Bb");
  });

  it("un acorde solo marca sus notas", () => {
    const positions = formulaPositions({
      root: "C",
      intervals: CHORDS.maj7.intervals,
      tuningMidi: standard,
      frets: 5,
    });
    const uniqueNotes = new Set(positions.map((p) => p.note));
    expect(uniqueNotes).toEqual(new Set(["C", "E", "G", "B"]));
  });

  it("la pentatónica cubre 2 notas por cuerda en la caja 1", () => {
    const positions = formulaPositions({
      root: "A",
      intervals: SCALES["minor-pentatonic"].intervals,
      tuningMidi: standard,
      frets: 8,
    });
    const box1 = positions.filter((p) => p.fret >= 5 && p.fret <= 8);
    for (let string = 0; string < 6; string++) {
      expect(box1.filter((p) => p.string === string)).toHaveLength(2);
    }
  });
});

describe("formulaMidiSequence", () => {
  it("termina en la octava de la raíz", () => {
    const seq = formulaMidiSequence({ root: "C", intervals: SCALES.major.intervals });
    expect(seq).toHaveLength(8);
    expect(seq[7] - seq[0]).toBe(12);
  });

  it("respeta los semitonos de la fórmula", () => {
    const seq = formulaMidiSequence({
      root: "A",
      intervals: SCALES["minor-pentatonic"].intervals,
      baseMidi: 57,
    });
    expect(seq).toEqual([57, 60, 62, 64, 67, 69]);
  });
});
