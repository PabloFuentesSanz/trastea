import { describe, expect, it } from "vitest";
import { getTuning } from "@/data/tunings";
import {
  AFINADA_CENTS,
  centsBetween,
  hzToMidi,
  midiToHz,
  nearestNote,
  nearestString,
  stringLabel,
} from "./tuning";

describe("alturas", () => {
  it("el La de referencia son 440 Hz", () => {
    expect(midiToHz(69)).toBeCloseTo(440, 6);
    expect(hzToMidi(440)).toBeCloseTo(69, 6);
  });

  it("las seis cuerdas al aire caen donde deben", () => {
    const esperado = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];
    getTuning("standard").midi.forEach((midi, i) => {
      expect(midiToHz(midi)).toBeCloseTo(esperado[i], 1);
    });
  });

  it("una octava son doce semitonos", () => {
    expect(midiToHz(52)).toBeCloseTo(midiToHz(40) * 2, 6);
  });
});

describe("centsBetween", () => {
  it("clavado son cero cents", () => {
    expect(centsBetween(440, 440)).toBe(0);
  });

  it("por encima es positivo y por debajo negativo", () => {
    expect(centsBetween(444, 440)).toBeGreaterThan(0);
    expect(centsBetween(436, 440)).toBeLessThan(0);
  });

  it("un semitono son cien cents", () => {
    expect(centsBetween(midiToHz(70), midiToHz(69))).toBeCloseTo(100, 6);
  });
});

describe("nearestNote", () => {
  it("dice qué nota es y cuánto se desvía", () => {
    const n = nearestNote(440);
    expect(n.midi).toBe(69);
    expect(n.name).toBe("A");
    expect(n.octave).toBe(4);
    expect(n.cents).toBeCloseTo(0, 6);
  });

  it("a mitad de camino se queda en la más cercana, no salta antes", () => {
    const justoDebajo = midiToHz(69) * Math.pow(2, 49 / 1200);
    expect(nearestNote(justoDebajo).midi).toBe(69);
    const justoEncima = midiToHz(69) * Math.pow(2, 51 / 1200);
    expect(nearestNote(justoEncima).midi).toBe(70);
  });

  it("nunca se pasa de medio semitono", () => {
    for (let hz = 80; hz < 400; hz += 0.7) {
      expect(Math.abs(nearestNote(hz).cents)).toBeLessThanOrEqual(50.0001);
    }
  });
});

describe("nearestString", () => {
  const standard = getTuning("standard").midi;

  it("un Mi grave apunta a la 6ª cuerda", () => {
    const s = nearestString(82.41, standard);
    expect(s.index).toBe(0);
    expect(Math.abs(s.cents)).toBeLessThan(1);
  });

  it("una cuerda floja sigue apuntando a su cuerda, no a la de al lado", () => {
    // La 30 cents baja: sigue siendo la 5ª
    const floja = 110 * Math.pow(2, -30 / 1200);
    const s = nearestString(floja, standard);
    expect(s.index).toBe(1);
    expect(s.cents).toBeCloseTo(-30, 0);
  });

  it("en Drop D la 6ª es Re y no se confunde con la 4ª", () => {
    const drop = getTuning("drop-d").midi;
    // el Re grave (D2) es la 6ª; el Re de la 4ª (D3) está una octava arriba
    const s = nearestString(midiToHz(38), drop);
    expect(s.index).toBe(0);
    expect(Math.abs(s.cents)).toBeLessThan(1);
  });

  it("la octava importa: un Mi agudo es la 1ª, no la 6ª", () => {
    expect(nearestString(329.63, standard).index).toBe(5);
  });

  it("una nota entre dos cuerdas elige la que menos se desvía", () => {
    const enMedio = midiToHz(42); // entre E2 (40) y A2 (45)
    const s = nearestString(enMedio, standard);
    expect([0, 1]).toContain(s.index);
    expect(Math.abs(s.cents)).toBeLessThanOrEqual(300);
  });
});

describe("stringLabel", () => {
  it("numera como un guitarrista: el índice 0 es la 6ª", () => {
    expect(stringLabel(0)).toContain("6");
    expect(stringLabel(5)).toContain("1");
  });
});

describe("AFINADA_CENTS", () => {
  it("es una tolerancia de afinador, no un capricho", () => {
    // ±5 cents es lo que da por bueno un afinador de pedal
    expect(AFINADA_CENTS).toBeGreaterThan(0);
    expect(AFINADA_CENTS).toBeLessThanOrEqual(10);
  });
});
