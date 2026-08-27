/**
 * Cuerda pulsada por Karplus-Strong.
 *
 * Un oscilador con envolvente suena a sintetizador barato porque una cuerda
 * de verdad no es una onda: es ruido metido en un tubo que se va filtrando.
 * Eso es exactamente lo que hace este algoritmo — una ráfaga de ruido dando
 * vueltas por una línea de retardo del largo del periodo, perdiendo agudos
 * en cada vuelta. Sale casi gratis y suena a cuerda.
 *
 * Es matemática pura, así que se puede probar: que suene a la altura pedida,
 * que se apague, que las graves duren más que las agudas.
 */

/**
 * Cómo se ataca la cuerda. Es la mitad del timbre: la misma cuerda pulsada
 * con la yema o con una púa suena a dos instrumentos distintos.
 */
export type Excitation = "dedo" | "pua" | "martillo";

export interface PluckOptions {
  /** 0-1: cuánto agudo conserva en cada vuelta. Más alto, más brillante. */
  brightness?: number;
  /** con qué se ataca */
  excitation?: Excitation;
  /** multiplica la cola: 1 = normal, 2 = el doble de sustain */
  decayScale?: number;
  /**
   * Rigidez de la cuerda: hace que los armónicos suban un pelín respecto al
   * múltiplo exacto. Es lo que distingue una cuerda golpeada (piano) de una
   * pulsada, y a poco que se pase suena desafinado.
   */
  inharmonicity?: number;
  /** semilla para que la excitación sea reproducible (y los tests, estables) */
  seed?: number;
}

/**
 * Cuánto se suaviza la ráfaga inicial y con cuánta fuerza entra.
 * `suavizado` alto = ataque redondo (yema); bajo = ataque con filo (púa).
 */
const EXCITATION: Record<Excitation, { suavizado: number; fuerza: number }> = {
  dedo: { suavizado: 0.62, fuerza: 0.72 },
  pua: { suavizado: 0.18, fuerza: 1 },
  martillo: { suavizado: 0.8, fuerza: 0.95 },
};

/** Un poco de agudo sin filtrar: cuerda cálida, no caja de música. */
const DEFAULT_BRIGHTNESS = 0.35;

/** Ruido reproducible: un generador congruencial de toda la vida. */
function random(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/**
 * Muestras de una nota pulsada. `frequency` en Hz, `seconds` de cola.
 *
 * La pérdida por vuelta se calcula desde la frecuencia: una cuerda grave da
 * menos vueltas por segundo, así que se apaga más despacio. Sin esto, todas
 * las notas durarían lo mismo y sonaría a juguete.
 */
export function pluckSamples(
  sampleRate: number,
  frequency: number,
  seconds: number,
  options: PluckOptions = {},
): Float32Array<ArrayBuffer> {
  const total = Math.round(sampleRate * seconds);
  const out = new Float32Array(new ArrayBuffer(total * 4));
  if (total === 0) return out;

  const brightness = options.brightness ?? DEFAULT_BRIGHTNESS;
  const ataque = EXCITATION[options.excitation ?? "pua"];
  const period = Math.max(2, Math.round(sampleRate / frequency));

  // la línea de retardo, cargada con el ataque: ruido con un poco de cuerpo
  const line = new Float32Array(period);
  const rnd = random(options.seed ?? 12345);
  let previous = 0;
  for (let i = 0; i < period; i++) {
    const noise = rnd() * 2 - 1;
    // suavizar la excitación quita el chasquido metálico del ataque
    previous = previous * ataque.suavizado + noise * (1 - ataque.suavizado);
    line[i] = previous * ataque.fuerza;
  }

  /**
   * Cuánto sobrevive cada vuelta. Se busca que la nota tarde en apagarse un
   * tiempo que dependa de la altura: las graves aguantan, las agudas no.
   */
  const vueltasPorSegundo = sampleRate / period;
  const segundosDeCola =
    Math.min(3.5, 90 / Math.max(frequency, 40)) * (options.decayScale ?? 1);
  const decay = Math.pow(0.001, 1 / (vueltasPorSegundo * segundosDeCola));

  /**
   * La rigidez se aplica como un desfase dentro del bucle: en vez de leer la
   * muestra siguiente, se lee un poco más allá. Sube los armónicos agudos sin
   * mover la fundamental, que es justo lo que hace una cuerda gruesa.
   */
  const rigidez = options.inharmonicity ?? 0;

  // ataque corto para que no aparezca de golpe (evita el clic)
  const attack = Math.min(Math.round(sampleRate * 0.004), total);

  let index = 0;
  let filtered = 0;
  for (let i = 0; i < total; i++) {
    const current = line[index];
    const salto = 1 + Math.floor(rigidez * period);
    const next = line[(index + salto) % period];

    // media de dos muestras vecinas: el filtro paso-bajo del bucle
    filtered = (current + next) * 0.5;
    // el brillo dice cuánto se libra del filtro: a 1 no se filtra nada
    const value = (current * brightness + filtered * (1 - brightness)) * decay;

    line[index] = value;
    index = (index + 1) % period;

    const envelope = i < attack ? i / attack : 1;
    out[i] = Math.max(-1, Math.min(1, current * envelope));
  }

  return out;
}
