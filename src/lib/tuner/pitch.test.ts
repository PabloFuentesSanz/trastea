import { describe, expect, it } from "vitest";
import { detectPitch } from "./pitch";

const SR = 44100;

/**
 * Ruido determinista de verdad. Un producto de senos NO vale: parece ruido y
 * es periódico, así que el detector le encuentra tono con toda la razón.
 */
function generador(semilla = 12345) {
  let estado = semilla;
  return () => {
    estado = (estado * 1103515245 + 12345) % 2147483648;
    return estado / 2147483648;
  };
}
const aleatorio = generador();

/** Un seno puro de `hz`, con los armónicos que se le pidan. */
function tono(
  hz: number,
  { seconds = 0.1, sr = SR, harmonics = [1], gain = 0.5, noise = 0 } = {},
): Float32Array {
  const n = Math.round(seconds * sr);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    let v = 0;
    harmonics.forEach((amp, k) => {
      v += amp * Math.sin((2 * Math.PI * hz * (k + 1) * i) / sr);
    });
    if (noise > 0) v += noise * (aleatorio() * 2 - 1);
    buf[i] = v * gain;
  }
  return buf;
}

/** Diferencia en cents entre lo detectado y lo real. */
function cents(detectado: number, real: number): number {
  return Math.abs(1200 * Math.log2(detectado / real));
}

describe("detectPitch", () => {
  it("clava las seis cuerdas al aire", () => {
    const cuerdas = [
      ["6ª Mi", 82.41],
      ["5ª La", 110.0],
      ["4ª Re", 146.83],
      ["3ª Sol", 196.0],
      ["2ª Si", 246.94],
      ["1ª Mi", 329.63],
    ] as const;
    for (const [nombre, hz] of cuerdas) {
      const detectado = detectPitch(tono(hz), SR);
      expect(detectado, nombre).not.toBeNull();
      expect(cents(detectado!, hz), `${nombre}: ${detectado}`).toBeLessThan(5);
    }
  });

  it("con armónicos de guitarra no se va a la octava", () => {
    // una cuerda real tiene el 2º y el 3er armónico muy presentes; un
    // detector ingenuo devolvería 165 Hz en vez de 82
    const buf = tono(82.41, { harmonics: [1, 0.8, 0.6, 0.4, 0.3] });
    const detectado = detectPitch(buf, SR);
    expect(detectado).not.toBeNull();
    expect(cents(detectado!, 82.41)).toBeLessThan(10);
  });

  it("aunque el fundamental sea flojo, sigue siendo el fundamental", () => {
    // lo que pasa de verdad en una acústica pequeña: el 1er armónico apenas
    // suena y el 2º manda
    const buf = tono(110, { harmonics: [0.25, 1, 0.7, 0.4] });
    const detectado = detectPitch(buf, SR);
    expect(detectado).not.toBeNull();
    expect(cents(detectado!, 110)).toBeLessThan(15);
  });

  it("distingue una cuerda desafinada de la afinada", () => {
    // 20 cents por encima de La: la aguja tiene que verlo
    const desafinada = 110 * Math.pow(2, 20 / 1200);
    const detectado = detectPitch(tono(desafinada), SR);
    expect(detectado).not.toBeNull();
    expect(cents(detectado!, 110)).toBeGreaterThan(12);
    expect(cents(detectado!, desafinada)).toBeLessThan(5);
  });

  it("en silencio no se inventa una nota", () => {
    expect(detectPitch(new Float32Array(4096), SR)).toBeNull();
  });

  it("con la señal muy floja tampoco: es ruido de sala", () => {
    expect(detectPitch(tono(110, { gain: 0.0005 }), SR)).toBeNull();
  });

  it("con ruido sin tono devuelve null en vez de un número cualquiera", () => {
    const azar = generador(987);
    const ruido = new Float32Array(4096);
    for (let i = 0; i < ruido.length; i += 1) ruido[i] = 0.4 * (azar() * 2 - 1);
    expect(detectPitch(ruido, SR)).toBeNull();
  });

  it("el zumbido de la red no es una cuerda", () => {
    // 50 Hz cae por debajo del Mi grave: su periodo no entra en la ventana
    expect(detectPitch(tono(50), SR)).toBeNull();
    expect(detectPitch(tono(50, { harmonics: [1, 0.5] }), SR)).toBeNull();
  });

  it("una nota con ruido de sala encima se sigue detectando", () => {
    const detectado = detectPitch(tono(196, { noise: 0.15 }), SR);
    expect(detectado).not.toBeNull();
    expect(cents(detectado!, 196)).toBeLessThan(10);
  });

  it("le vale un buffer corto, que es lo que da el navegador", () => {
    const buf = tono(196, { seconds: 2048 / SR });
    const detectado = detectPitch(buf, SR);
    expect(detectado).not.toBeNull();
    expect(cents(detectado!, 196)).toBeLessThan(10);
  });

  it("funciona igual a 48 kHz", () => {
    const detectado = detectPitch(tono(146.83, { sr: 48000 }), 48000);
    expect(detectado).not.toBeNull();
    expect(cents(detectado!, 146.83)).toBeLessThan(5);
  });
});
