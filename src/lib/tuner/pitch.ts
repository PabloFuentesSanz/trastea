/**
 * Detección de tono para el afinador.
 *
 * Puro y sin dependencias: entra un buffer de audio y sale una frecuencia,
 * así que se puede comprobar con señales sintéticas —incluidas las que
 * engañan a un detector ingenuo— en vez de "probando con la guitarra".
 *
 * El método es la NSDF de McLeod (una autocorrelación normalizada). Se elige
 * frente a mirar el pico del espectro porque una cuerda de guitarra tiene los
 * armónicos más fuertes que el fundamental: el pico del espectro devolvería
 * la octava, que es el fallo clásico de los afinadores caseros.
 */

/** Alcance de una guitarra: del Mi grave (82 Hz) a un Mi agudo con margen. */
export const MIN_HZ = 70;
export const MAX_HZ = 1400;

/** Por debajo de esto no hay cuerda, hay sala. */
const MIN_RMS = 0.008;
/**
 * Cuánta periodicidad hace falta para fiarse. Un ruido sin tono nunca llega:
 * es lo que separa "no estás tocando" de "estás tocando un Mi".
 */
const MIN_CLARITY = 0.7;
/**
 * Se coge el PRIMER pico que llegue a esta parte del mejor pico, no el mejor.
 * El máximo absoluto suele caer en el doble del periodo (una octava abajo);
 * el primero que destaca es el periodo de verdad.
 */
const PEAK_RATIO = 0.9;

export function detectPitch(
  samples: Float32Array,
  sampleRate: number,
  { minHz = MIN_HZ, maxHz = MAX_HZ, minClarity = MIN_CLARITY } = {},
): number | null {
  const n = samples.length;
  if (n < 512) return null;

  let energia = 0;
  for (let i = 0; i < n; i += 1) energia += samples[i] * samples[i];
  if (Math.sqrt(energia / n) < MIN_RMS) return null;

  const minLag = Math.max(2, Math.floor(sampleRate / maxHz));
  const maxLag = Math.min(Math.floor(sampleRate / minHz), Math.floor(n / 2));
  if (maxLag <= minLag) return null;

  // NSDF: 2·r(τ) / m(τ), acotada en [-1, 1]. El 1 es periodicidad perfecta.
  const nsdf = new Float32Array(maxLag + 1);
  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let r = 0;
    let m = 0;
    for (let i = 0; i < n - lag; i += 1) {
      const a = samples[i];
      const b = samples[i + lag];
      r += a * b;
      m += a * a + b * b;
    }
    nsdf[lag] = m > 0 ? (2 * r) / m : 0;
  }

  // los máximos locales, saltándose la caída inicial
  const picos: number[] = [];
  let subiendo = false;
  for (let lag = minLag + 1; lag < maxLag; lag += 1) {
    if (nsdf[lag] > 0 && nsdf[lag] > nsdf[lag - 1]) subiendo = true;
    else if (subiendo && nsdf[lag] >= nsdf[lag + 1]) {
      picos.push(lag);
      subiendo = false;
    }
  }
  if (picos.length === 0) return null;

  const mejor = Math.max(...picos.map((lag) => nsdf[lag]));
  if (mejor < minClarity) return null;
  const elegido = picos.find((lag) => nsdf[lag] >= mejor * PEAK_RATIO);
  if (elegido === undefined) return null;

  const lag = refinar(nsdf, elegido);
  const hz = sampleRate / lag;
  return hz >= minHz && hz <= maxHz ? hz : null;
}

/**
 * Afina el pico con una parábola por los tres puntos de alrededor. Sin esto
 * la resolución es la del entero: en la 1ª cuerda serían casi 20 cents, y un
 * afinador que se equivoca 20 cents no sirve para nada.
 */
function refinar(nsdf: Float32Array, lag: number): number {
  const y0 = nsdf[lag - 1] ?? 0;
  const y1 = nsdf[lag];
  const y2 = nsdf[lag + 1] ?? 0;
  const denominador = 2 * (2 * y1 - y0 - y2);
  if (Math.abs(denominador) < 1e-12) return lag;
  return lag + (y2 - y0) / denominador;
}
