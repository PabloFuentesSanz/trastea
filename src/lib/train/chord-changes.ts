/**
 * Cambios de acorde en un minuto: el entrenamiento práctico más rentable
 * del principio. Se elige una pareja, se pone el cronómetro a 60 segundos y
 * se cuenta cuántas veces se cambia de uno al otro sin que suene sucio.
 *
 * Aquí vive lo puro: las parejas por nivel, la aritmética y la valoración.
 * Cuántos cambios hiciste lo guarda la base de datos; el componente solo
 * cuenta toques.
 */

import type { TrainLevel } from "./taxonomy";

export interface ParejaDeAcordes {
  id: string;
  acordes: readonly [string, string];
  /**
   * digitación fija de 6ª a 1ª para los acordes que el generador no elige
   * como queremos (el Fa pequeño sin cejilla)
   */
  trastes?: Readonly<Record<string, string>>;
  level: TrainLevel;
  /** por qué esta pareja y no otra, en una línea */
  porQue: string;
}

const FA_PEQUENO = { F: "x x 3 2 1 1" } as const;

export const PAREJAS: readonly ParejaDeAcordes[] = [
  // nivel 1: Desde cero, semanas 1-2
  {
    id: "em-am",
    acordes: ["Em", "Am"],
    level: 1,
    porQue: "La misma forma bajada una cuerda: el primer cambio de todos",
  },
  {
    id: "em-d",
    acordes: ["Em", "D"],
    level: 1,
    porQue: "Los dos primeros acordes de media discografía de folk",
  },
  {
    id: "am-e",
    acordes: ["Am", "E"],
    level: 1,
    porQue: "Misma forma, una cuerda más grave: el cambio de Bella ciao",
  },
  {
    id: "a-e",
    acordes: ["A", "E"],
    level: 1,
    porQue: "Achy Breaky Heart entera vive en este cambio",
  },
  {
    id: "a-d",
    acordes: ["A", "D"],
    level: 1,
    porQue: "El dedo 3 casi no se mueve: aprende a dejarlo quieto",
  },
  {
    id: "d-e",
    acordes: ["D", "E"],
    level: 1,
    porQue: "Cierra el trío A-D-E: Wild Thing",
  },
  // nivel 2: semanas 3-4
  {
    id: "g-c",
    acordes: ["G", "C"],
    level: 2,
    porQue: "El cambio del folk: G a C con el dedo 3 de ancla",
  },
  {
    id: "c-am",
    acordes: ["C", "Am"],
    level: 2,
    porQue: "Solo se mueve un dedo: si te cuesta, es la postura de C",
  },
  {
    id: "c-d",
    acordes: ["C", "D"],
    level: 2,
    porQue: "Los dos acordes que más se resisten, seguidos",
  },
  {
    id: "g-d",
    acordes: ["G", "D"],
    level: 2,
    porQue: "Knockin' on Heaven's Door y Stand by Me pasan por aquí",
  },
  {
    id: "am-dm",
    acordes: ["Am", "Dm"],
    level: 2,
    porQue: "Los dos menores de Bella ciao",
  },
  {
    id: "am-f",
    acordes: ["Am", "F"],
    trastes: FA_PEQUENO,
    level: 2,
    porQue: "El Fa pequeño: Save Tonight y el vamp C-Am-F-G",
  },
  {
    id: "c-f",
    acordes: ["C", "F"],
    trastes: FA_PEQUENO,
    level: 2,
    porQue: "El cambio que hace que Guantanamera se pueda tocar",
  },
  // nivel 3: cejillas
  {
    id: "f-c",
    acordes: ["F", "C"],
    level: 3,
    porQue: "El Fa con cejilla entera: el primer muro de todo el mundo",
  },
  {
    id: "bm-g",
    acordes: ["Bm", "G"],
    level: 3,
    porQue: "Si menor con cejilla: With or Without You",
  },
  {
    id: "f-bm",
    acordes: ["F", "Bm"],
    level: 3,
    porQue: "Dos cejillas seguidas, forma de Mi y forma de La",
  },
];

export function parejaPorId(id: string): ParejaDeAcordes | undefined {
  return PAREJAS.find((p) => p.id === id);
}

export function parejasDeNivel(level: TrainLevel): ParejaDeAcordes[] {
  return PAREJAS.filter((p) => p.level === level);
}

/** La que toca después: la siguiente del nivel, o la primera del siguiente. */
export function siguientePareja(id: string): ParejaDeAcordes | undefined {
  const idx = PAREJAS.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  return PAREJAS[idx + 1];
}

/** Duración estándar de una tanda, en segundos. */
export const SEGUNDOS = 60;

export function cambiosPorMinuto(cambios: number, segundos: number): number {
  if (segundos <= 0) return 0;
  return Math.round((cambios * 60) / segundos);
}

export interface Valoracion {
  etiqueta: string;
  consejo: string;
  /** a partir de 30 por minuto el cambio ya llega a tiempo en una canción lenta */
  listaParaSubir: boolean;
}

export const CAMBIOS_PARA_SUBIR = 30;

export function valorarCambios(porMinuto: number): Valoracion {
  if (porMinuto < 10) {
    return {
      etiqueta: "Arrancando",
      consejo:
        "Ve más despacio y mira solo el dedo que llega tarde. Ahora mismo la velocidad no importa nada.",
      listaParaSubir: false,
    };
  }
  if (porMinuto < CAMBIOS_PARA_SUBIR) {
    return {
      etiqueta: "Va cogiendo forma",
      consejo:
        "Busca el dedo que no cambia entre los dos acordes y déjalo quieto: es el ancla que ahorra la mitad del viaje.",
      listaParaSubir: false,
    };
  }
  if (porMinuto < 60) {
    return {
      etiqueta: "A tiempo en una canción",
      consejo:
        "Con esto ya cambias a tiempo en cualquier tema lento. Pasa a la pareja siguiente y vuelve a esta un día sí y otro no.",
      listaParaSubir: true,
    };
  }
  return {
    etiqueta: "Automático",
    consejo:
      "Ya no piensas este cambio. Toca ponerlo dentro de una canción a su tempo real.",
    listaParaSubir: true,
  };
}
