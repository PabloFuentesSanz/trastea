import { describe, expect, it } from "vitest";
import { pluckSamples } from "./string-synth";

const SR = 44100;

/** Energía media de un tramo, para ver si la cuerda se apaga. */
function rms(data: Float32Array, from: number, to: number): number {
  let sum = 0;
  for (let i = from; i < to; i++) sum += data[i] * data[i];
  return Math.sqrt(sum / (to - from));
}

/**
 * Periodo dominante por autocorrelación: si el modelo funciona, coincide con
 * el de la frecuencia pedida. Es la prueba de que suena afinado.
 */
function dominantPeriod(data: Float32Array, min: number, max: number): number {
  let mejor = min;
  let mejorCorrelacion = -Infinity;
  const desde = Math.floor(data.length * 0.15);
  const hasta = Math.min(desde + 4096, data.length - max - 1);
  for (let lag = min; lag <= max; lag++) {
    let c = 0;
    for (let i = desde; i < hasta; i++) c += data[i] * data[i + lag];
    if (c > mejorCorrelacion) {
      mejorCorrelacion = c;
      mejor = lag;
    }
  }
  return mejor;
}

describe("pluckSamples", () => {
  it("da tantas muestras como segundos se le piden", () => {
    expect(pluckSamples(SR, 220, 0.5).length).toBe(Math.round(SR * 0.5));
  });

  it("no produce NaN ni se sale de rango", () => {
    const data = pluckSamples(SR, 110, 1);
    for (const v of data) {
      expect(Number.isFinite(v)).toBe(true);
      expect(Math.abs(v)).toBeLessThanOrEqual(1);
    }
  });

  it("la cuerda se apaga: el final suena menos que el principio", () => {
    const data = pluckSamples(SR, 196, 1.5);
    const decima = Math.floor(data.length / 10);
    expect(rms(data, 0, decima)).toBeGreaterThan(
      rms(data, data.length - decima, data.length),
    );
  });

  it("arranca en silencio y no chasquea", () => {
    const data = pluckSamples(SR, 196, 1);
    expect(Math.abs(data[0])).toBeLessThan(0.2);
  });

  it("suena a la altura pedida", () => {
    for (const freq of [110, 220, 440]) {
      const periodo = SR / freq;
      const encontrado = dominantPeriod(
        pluckSamples(SR, freq, 1),
        Math.floor(periodo * 0.8),
        Math.ceil(periodo * 1.2),
      );
      // menos de un semitono de desvío (un semitono ≈ 6% de periodo)
      expect(Math.abs(encontrado - periodo) / periodo, `${freq} Hz`).toBeLessThan(0.06);
    }
  });

  it("las notas graves suenan más tiempo que las agudas, como una cuerda", () => {
    const grave = pluckSamples(SR, 82, 2);
    const agudo = pluckSamples(SR, 660, 2);
    const cola = (d: Float32Array) => rms(d, Math.floor(d.length * 0.7), d.length);
    expect(cola(grave)).toBeGreaterThan(cola(agudo));
  });

  it("es determinista con la misma semilla", () => {
    const a = pluckSamples(SR, 220, 0.3, { seed: 7 });
    const b = pluckSamples(SR, 220, 0.3, { seed: 7 });
    expect(Array.from(a.slice(0, 200))).toEqual(Array.from(b.slice(0, 200)));
  });

  it("con brillo alto tiene más agudos que con brillo bajo", () => {
    /** energía de las diferencias entre muestras: sube con el contenido agudo */
    const agudos = (d: Float32Array) => {
      let sum = 0;
      for (let i = 1; i < d.length; i++) sum += (d[i] - d[i - 1]) ** 2;
      return sum;
    };
    const brillante = pluckSamples(SR, 220, 1, { brightness: 0.95, seed: 1 });
    const apagado = pluckSamples(SR, 220, 1, { brightness: 0.4, seed: 1 });
    expect(agudos(brillante)).toBeGreaterThan(agudos(apagado));
  });
});
