import { describe, expect, it } from "vitest";
import {
  getInstrument,
  INSTRUMENTS,
  INSTRUMENT_IDS,
  isInstrumentId,
} from "./instruments";
import { pluckSamples } from "@/lib/backing/string-synth";

const SR = 44100;

/**
 * Proxy de brillo: cuánto cambia la señal de una muestra a la siguiente,
 * relativo a su energía. Mucho agudo = mucho cambio. No es un análisis
 * espectral, pero ordena los timbres igual y cuesta cuatro líneas.
 */
function brillo(samples: Float32Array): number {
  let diff = 0;
  let energia = 0;
  for (let i = 1; i < samples.length; i += 1) {
    diff += Math.abs(samples[i] - samples[i - 1]);
    energia += Math.abs(samples[i]);
  }
  return energia === 0 ? 0 : diff / energia;
}

/** Cuánto tarda en caer por debajo de un umbral, en segundos. */
function cola(samples: Float32Array): number {
  const umbral = 0.02;
  for (let i = samples.length - 1; i >= 0; i -= 1) {
    if (Math.abs(samples[i]) > umbral) return i / SR;
  }
  return 0;
}

/** Pico absoluto sin desparramar el array: 132.300 muestras revientan la pila. */
function pico(samples: Float32Array, hasta = samples.length): number {
  let max = 0;
  for (let i = 0; i < hasta; i += 1) max = Math.max(max, Math.abs(samples[i]));
  return max;
}

function muestras(id: string, frequency = 220) {
  const inst = getInstrument(id);
  return pluckSamples(SR, frequency, 3, {
    brightness: inst.brightness,
    excitation: inst.excitation,
    decayScale: inst.decayScale,
    inharmonicity: inst.inharmonicity,
    seed: 42,
  });
}

describe("catálogo de instrumentos", () => {
  it("cada entrada se conoce por su clave", () => {
    for (const [key, inst] of Object.entries(INSTRUMENTS)) {
      expect(inst.id).toBe(key);
    }
  });

  it("los ids declarados son los que hay", () => {
    expect([...INSTRUMENT_IDS].sort()).toEqual(Object.keys(INSTRUMENTS).sort());
  });

  it("todos tienen nombre y una frase que los distinga", () => {
    for (const inst of Object.values(INSTRUMENTS)) {
      expect(inst.name.length).toBeGreaterThan(0);
      expect(inst.summary.length).toBeGreaterThan(0);
    }
  });

  it("getInstrument cae en la eléctrica si le dan algo raro", () => {
    expect(getInstrument("marciano").id).toBe("electrica");
  });

  it("isInstrumentId distingue", () => {
    expect(isInstrumentId("nylon")).toBe(true);
    expect(isInstrumentId("marciano")).toBe(false);
  });
});

describe("los timbres suenan distinto de verdad", () => {
  it("todos producen señal utilizable", () => {
    for (const id of INSTRUMENT_IDS) {
      const s = muestras(id);
      expect(s.length).toBe(SR * 3);
      expect(s.every((v) => Number.isFinite(v) && Math.abs(v) <= 1)).toBe(true);
      // que suene algo: un instrumento mudo no es un timbre
      expect(pico(s), id).toBeGreaterThan(0.05);
    }
  });

  it("la clásica de nylon es más oscura que la eléctrica", () => {
    expect(brillo(muestras("nylon"))).toBeLessThan(brillo(muestras("electrica")));
  });

  it("la acústica de acero es más brillante que la de nylon", () => {
    expect(brillo(muestras("acustica"))).toBeGreaterThan(brillo(muestras("nylon")));
  });

  it("el bajo se apaga más despacio que la clásica", () => {
    expect(cola(muestras("bajo", 82))).toBeGreaterThan(cola(muestras("nylon", 82)));
  });

  it("no hay dos instrumentos con el mismo brillo: si no, sobra uno", () => {
    const valores = INSTRUMENT_IDS.map((id) => Math.round(brillo(muestras(id)) * 1000));
    expect(new Set(valores).size).toBe(valores.length);
  });
});

describe("la excitación cambia el ataque", () => {
  it("la púa ataca más fuerte que la yema", () => {
    const ataque = (ex: "dedo" | "pua" | "martillo") =>
      pico(pluckSamples(SR, 220, 1, { excitation: ex, seed: 7 }), 500);
    expect(ataque("pua")).toBeGreaterThan(ataque("dedo"));
  });
});
