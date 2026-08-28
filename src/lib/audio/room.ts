/**
 * Lo que separa "una cuerda sintetizada" de "alguien tocando una guitarra".
 *
 * El modelo de cuerda ya estaba bien; lo que faltaba era todo lo demás: la
 * sala donde suena, que dos pulsaciones nunca son idénticas, y que el sonido
 * no sale de un punto en mitad de la cabeza. Son tres cosas baratas y las
 * tres se notan más que cualquier retoque al timbre.
 */

/** Ruido reproducible: el mismo generador que usa la cuerda. */
function random(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/** Antes de la sala llega el sonido directo: unos milisegundos de nada. */
const PREDELAY_S = 0.012;

/**
 * La respuesta de una sala pequeña, generada: ruido que se apaga
 * exponencialmente, distinto en cada canal (de ahí el ancho) y con los
 * agudos muriendo antes que los graves, como en una habitación de verdad.
 *
 * Generarla en vez de cargar un archivo son 0 kB de descarga y una sala que
 * se puede afinar cambiando dos números.
 */
export function impulseResponse(
  sampleRate: number,
  seconds: number,
  decay: number,
  seed = 1,
): [Float32Array<ArrayBuffer>, Float32Array<ArrayBuffer>] {
  const total = Math.round(sampleRate * seconds);
  const predelay = Math.round(sampleRate * PREDELAY_S);
  const canales: [Float32Array<ArrayBuffer>, Float32Array<ArrayBuffer>] = [
    new Float32Array(new ArrayBuffer(total * 4)),
    new Float32Array(new ArrayBuffer(total * 4)),
  ];

  for (let c = 0; c < 2; c++) {
    const rnd = random(seed * 7919 + c * 104729);
    // paso-bajo de un polo: la cola se va oscureciendo
    let previo = 0;
    for (let i = predelay; i < total; i++) {
      const t = (i - predelay) / (total - predelay);
      const envolvente = Math.pow(1 - t, decay);
      const ruido = rnd() * 2 - 1;
      previo = previo * 0.35 + ruido * 0.65;
      canales[c][i] = previo * envolvente;
    }
  }
  return canales;
}

/** Cuánto se abre el estéreo como mucho. Más que esto ya marea. */
const ANCHO = 0.35;

/**
 * Dónde cae cada nota en el estéreo. Las graves sostienen el centro y las
 * agudas se abren, que es como se oye una guitarra grabada de cerca.
 */
export function panPorAltura(midi: number): number {
  const normal = Math.min(1, Math.max(0, (midi - 40) / 48));
  return Number((normal * ANCHO).toFixed(3));
}

/** Cuánto se desafina una pulsación respecto a la anterior, en cents. */
const CENTS = 7;

export interface Variacion {
  cents: number;
  ganancia: number;
  /** segundos de retraso: la mano tampoco cae siempre en el mismo sitio */
  retraso: number;
}

/**
 * Dos pulsaciones de la misma nota nunca son iguales: cambia la afinación un
 * pelo, la fuerza y el momento exacto. Sin esto, repetir una nota suena a
 * ametralladora — es el delator número uno de que algo está sintetizado.
 */
export function variacionDeAtaque(rnd: () => number = Math.random): Variacion {
  const centrado = () => rnd() * 2 - 1;
  return {
    cents: Number((centrado() * CENTS).toFixed(2)),
    ganancia: Number((1 + centrado() * 0.1).toFixed(3)),
    retraso: Number((rnd() * 0.006).toFixed(4)),
  };
}
