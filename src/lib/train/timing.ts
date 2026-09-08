/**
 * Ritmo a golpe: el click suena y tú marcas cada pulso con una tecla. Se
 * mide cuánto te separas del click, en milisegundos, y hacia dónde.
 *
 * Pura: recibe tiempos del reloj de audio y devuelve números y palabras.
 */

/** Ventana dentro de la cual un golpe se considera en el pulso. */
export const VENTANA_MS = 40;

/**
 * Desvío del golpe respecto al pulso más cercano. Negativo = por delante.
 * `ultimoTick` es el tiempo de audio del último click que sonó y
 * `segundosPorPulso` la distancia entre clicks.
 */
export function desvioMs(
  golpe: number,
  ultimoTick: number,
  segundosPorPulso: number,
): number {
  const pulsos = Math.round((golpe - ultimoTick) / segundosPorPulso);
  const masCercano = ultimoTick + pulsos * segundosPorPulso;
  return Math.round((golpe - masCercano) * 1000);
}

export interface ResumenDeRitmo {
  golpes: number;
  /** desvío medio con signo: negativo = vas por delante del click */
  medioMs: number;
  /** cuánto bailas alrededor de tu media */
  dispersionMs: number;
  /** fracción de golpes dentro de la ventana */
  dentro: number;
  etiqueta: string;
  consejo: string;
}

export function resumenDeRitmo(desvios: readonly number[]): ResumenDeRitmo {
  if (desvios.length === 0) {
    return {
      golpes: 0,
      medioMs: 0,
      dispersionMs: 0,
      dentro: 0,
      etiqueta: "Sin golpes",
      consejo: "Arranca el click y marca cada pulso con la barra espaciadora.",
    };
  }
  const n = desvios.length;
  const media = desvios.reduce((a, b) => a + b, 0) / n;
  const varianza = desvios.reduce((a, d) => a + (d - media) ** 2, 0) / n;
  const dispersion = Math.sqrt(varianza);
  const dentro = desvios.filter((d) => Math.abs(d) <= VENTANA_MS).length / n;

  let etiqueta: string;
  let consejo: string;
  if (dentro >= 0.85 && dispersion < 25) {
    etiqueta = "Clavado";
    consejo =
      "Esto ya es tocar con el click, no al lado. Sube el tempo o pasa a corcheas.";
  } else if (Math.abs(media) > 30) {
    etiqueta = media < 0 ? "Por delante" : "Por detrás";
    consejo =
      media < 0
        ? "Vas adelantado: te anticipas al click. Deja que suene y cae con él, no antes."
        : "Vas por detrás: reaccionas al click en vez de sentirlo. Cuenta en voz alta y ataca en el número.";
  } else {
    etiqueta = "Bailando";
    consejo =
      "No vas ni delante ni detrás, pero cada golpe cae en un sitio distinto. Baja el tempo y mueve el pie.";
  }
  return {
    golpes: n,
    medioMs: Math.round(media),
    dispersionMs: Math.round(dispersion),
    dentro,
    etiqueta,
    consejo,
  };
}
