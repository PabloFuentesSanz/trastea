/**
 * El catálogo de entrenamientos que se generan solos.
 *
 * Cada entrenamiento declara de qué va, qué entrena y qué niveles tiene; cada
 * nivel sabe fabricar su mazo. Los mazos viven aquí y no en la base de datos:
 * lo único que se guarda por usuario es cuándo toca repasar cada tarjeta.
 *
 * Los ejercicios **cronometrados** no están aquí: esos son contenido y viven
 * en `/content/exercises`, porque los escribe una persona.
 */

import type { NoteName } from "@/lib/music/notes";
import type { TrainCard, Position } from "./cards";
import { boxesOf, scaleBoxPositions } from "./scales";
import type { TrainLevel, TrainMode, TrainSkill, TrainTheme } from "./taxonomy";

export interface DrillLevel {
  level: TrainLevel;
  /** qué entra en este nivel, en una línea */
  label: string;
  build: () => TrainCard[];
}

export interface Drill {
  slug: string;
  title: string;
  summary: string;
  theme: TrainTheme;
  skills: readonly TrainSkill[];
  mode: TrainMode;
  levels: readonly DrillLevel[];
}

// ---------- ayudas de generación ----------

const ALL_STRINGS = [0, 1, 2, 3, 4, 5];

function positions(strings: readonly number[], maxFret: number, minFret = 0): Position[] {
  const out: Position[] = [];
  for (const string of strings) {
    for (let fret = minFret; fret <= maxFret; fret += 1) out.push({ string, fret });
  }
  return out;
}

/** Intervalos por nombre, para que los niveles se lean. */
const IV = {
  unisono: 0,
  segundaMenor: 1,
  segundaMayor: 2,
  terceraMenor: 3,
  terceraMayor: 4,
  cuarta: 5,
  tritono: 6,
  quinta: 7,
  sextaMenor: 8,
  sextaMayor: 9,
  septimaMenor: 10,
  septimaMayor: 11,
  octava: 12,
} as const;

const CONSONANTES = [IV.terceraMayor, IV.terceraMenor, IV.quinta, IV.octava];
const DIATONICOS = [
  IV.segundaMayor,
  IV.terceraMenor,
  IV.terceraMayor,
  IV.cuarta,
  IV.quinta,
  IV.sextaMenor,
  IV.sextaMayor,
  IV.septimaMenor,
  IV.septimaMayor,
  IV.octava,
];
const TODOS = Object.values(IV).filter((s) => s > 0);

/**
 * Pares en la MISMA cuerda: el intervalo se lee contando trastes, que es como
 * se empieza.
 */
function sameStringPairs(
  strings: readonly number[],
  maxFret: number,
  semitones: readonly number[],
): TrainCard[] {
  const out: TrainCard[] = [];
  for (const string of strings) {
    for (const s of semitones) {
      for (let fret = 0; fret + s <= maxFret; fret += s <= 4 ? 3 : 4) {
        out.push({
          type: "interval_name",
          from: { string, fret },
          to: { string, fret: fret + s },
        });
      }
    }
  }
  return out;
}

/**
 * Pares cruzando a la cuerda de al lado: es el caso que de verdad cuesta,
 * porque el número de trastes ya no dice el intervalo.
 *
 * `destino` puede ser NEGATIVO —la nota aguda cae en un traste más bajo— y
 * ese es justamente el caso interesante: una tercera entre dos cuerdas se
 * toca así. Descartarlo dejaba fuera segundas y terceras cruzando, que son la
 * forma con la que se tocan todos los arpegios.
 */
function crossStringPairs(
  strings: readonly number[],
  maxFret: number,
  semitones: readonly number[],
  /** cada cuántos trastes se repite el par; sube para no inflar el mazo */
  step = 5,
): TrainCard[] {
  const out: TrainCard[] = [];
  const tuningSteps = [5, 5, 5, 4, 5]; // semitonos entre cuerdas contiguas
  for (const string of strings) {
    if (string + 1 >= 6) continue;
    const salto = tuningSteps[string];
    for (const s of semitones) {
      const destino = s - salto;
      if (destino > maxFret) continue;
      // el primer traste posible: si el destino baja, hay que empezar más
      // arriba para que la nota de llegada no caiga antes de la cejuela
      const desde = Math.max(0, -destino);
      for (let fret = desde; fret + Math.max(0, destino) <= maxFret; fret += step) {
        out.push({
          type: "interval_name",
          from: { string, fret },
          to: { string: string + 1, fret: fret + destino },
        });
      }
    }
  }
  return out;
}

/**
 * Puntos de partida repartidos por el mástil.
 *
 * Iba de cuatro en cuatro y paraba en `maxFret - 4`, así que se partía
 * SIEMPRE del traste 0, 4 u 8 — en todos los niveles, incluido el que se
 * llama "por todo el mástil". El recorte sobraba: la respuesta vale en
 * cualquier cuerda donde esté esa altura, no hace falta que quepa en la misma.
 */
function buildTargets(
  strings: readonly number[],
  maxFret: number,
  semitones: readonly number[],
  /** cada cuántos trastes se planta un punto de partida */
  step = 4,
): TrainCard[] {
  const out: TrainCard[] = [];
  for (const string of strings) {
    for (const s of semitones) {
      for (let fret = 0; fret <= maxFret; fret += step) {
        out.push({ type: "interval_build", from: { string, fret }, semitones: s });
      }
    }
  }
  return out;
}

const ROOTS_BASICAS = ["C", "G", "D", "A", "E", "F"] as const;
const ROOTS_TODAS = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
] as const;

function chordCards(roots: readonly string[], chordIds: readonly string[]): TrainCard[] {
  return roots.flatMap((root) =>
    chordIds.map((chordId) => ({ type: "chord_notes" as const, root, chordId })),
  );
}

/**
 * Grados: se preguntan sobre las posiciones de las cajas, no sobre trastes
 * sueltos. Así toda pregunta cae donde de verdad se toca esa escala, y no en
 * un sitio del mástil al que nunca vas.
 */
function degreeCards(
  roots: readonly NoteName[],
  scaleIds: readonly string[],
  boxes?: readonly number[],
): TrainCard[] {
  const out: TrainCard[] = [];
  for (const root of roots) {
    for (const scaleId of scaleIds) {
      const cajas = boxes ?? boxesOf(scaleId).slice(0, 1);
      const vistas = new Set<string>();
      for (const box of cajas) {
        if (box > boxesOf(scaleId).length) continue;
        for (const position of scaleBoxPositions(root, scaleId, box)) {
          const clave = `${position.string}:${position.fret}`;
          if (vistas.has(clave)) continue;
          vistas.add(clave);
          out.push({ type: "scale_degree", root, scaleId, position });
        }
      }
    }
  }
  return out;
}

/**
 * Cajas: una tarjeta por nota que se puede esconder. No se esconden las dos
 * de los extremos —la primera y la última de la caja— porque sin referencia
 * arriba o abajo no es memoria de la forma, es adivinar.
 */
function boxCards(
  roots: readonly NoteName[],
  scaleIds: readonly string[],
  boxes?: readonly number[],
): TrainCard[] {
  const out: TrainCard[] = [];
  for (const root of roots) {
    for (const scaleId of scaleIds) {
      for (const box of boxes ?? boxesOf(scaleId)) {
        if (box > boxesOf(scaleId).length) continue;
        const posiciones = scaleBoxPositions(root, scaleId, box);
        for (const missing of posiciones.slice(1, -1)) {
          out.push({ type: "scale_box", root, scaleId, box, missing });
        }
      }
    }
  }
  return out;
}

// ---------- el catálogo ----------

export const DRILLS: readonly Drill[] = [
  {
    slug: "notas-del-mastil",
    title: "Notas del mástil",
    summary:
      "Te señala una posición y dices qué nota es. Con repetición espaciada: insiste en las que fallas y te deja en paz con las que ya sabes.",
    theme: "diapason",
    skills: ["nombres-de-notas", "enarmonias"],
    mode: "identificar",
    levels: [
      {
        level: 1,
        label: "6ª y 5ª cuerda, trastes 0-5",
        build: () => positions([0, 1], 5).map((p) => ({ type: "fretboard_note", ...p })),
      },
      {
        level: 2,
        label: "Cuerdas graves, trastes 0-7",
        build: () =>
          positions([0, 1, 2], 7).map((p) => ({ type: "fretboard_note", ...p })),
      },
      {
        level: 3,
        label: "Las seis cuerdas, trastes 0-12",
        build: () =>
          positions(ALL_STRINGS, 12).map((p) => ({ type: "fretboard_note", ...p })),
      },
      {
        level: 4,
        label: "Las seis cuerdas, trastes 0-15",
        build: () =>
          positions(ALL_STRINGS, 15).map((p) => ({ type: "fretboard_note", ...p })),
      },
      {
        level: 5,
        label: "Mástil entero, trastes 0-17",
        build: () =>
          positions(ALL_STRINGS, 17).map((p) => ({ type: "fretboard_note", ...p })),
      },
    ],
  },

  {
    slug: "octavas",
    title: "Octavas por el mástil",
    summary:
      "Te da una nota y tienes que tocar la misma una octava arriba. Es el atajo clásico para orientarse: si sabes dónde está la octava, sabes dónde está todo.",
    theme: "diapason",
    skills: ["octavas", "nombres-de-notas"],
    mode: "identificar",
    levels: [
      {
        level: 1,
        label: "Desde la 6ª y la 5ª cuerda",
        build: () => buildTargets([0, 1], 12, [IV.octava]),
      },
      {
        level: 2,
        label: "Desde las cuatro cuerdas graves",
        build: () => buildTargets([0, 1, 2, 3], 12, [IV.octava]),
      },
      {
        level: 3,
        label: "Desde cualquier cuerda",
        build: () => buildTargets(ALL_STRINGS, 12, [IV.octava]),
      },
      {
        level: 4,
        label: "Octavas y quintas",
        build: () => buildTargets(ALL_STRINGS, 12, [IV.octava, IV.quinta]),
      },
    ],
  },

  {
    slug: "reconocer-intervalos",
    title: "Reconocer intervalos",
    summary:
      "Dos puntos marcados en el mástil: di qué intervalo hay entre ellos. Empieza en la misma cuerda —donde se cuentan trastes— y acaba cruzando cuerdas, que es donde de verdad se aprende.",
    theme: "intervalos",
    skills: ["reconocer-intervalos"],
    mode: "identificar",
    levels: [
      {
        level: 1,
        label: "Terceras, quintas y octavas en la misma cuerda",
        build: () => sameStringPairs([0, 1], 12, CONSONANTES),
      },
      {
        level: 2,
        label: "Intervalos diatónicos en la misma cuerda",
        build: () => sameStringPairs([0, 1, 2], 12, DIATONICOS),
      },
      {
        level: 3,
        label: "Todos, incluido el tritono, en la misma cuerda",
        build: () => sameStringPairs(ALL_STRINGS, 12, TODOS),
      },
      {
        level: 4,
        label: "Cruzando a la cuerda de al lado",
        build: () => [
          ...sameStringPairs(ALL_STRINGS, 12, TODOS),
          ...crossStringPairs([0, 1, 2], 12, DIATONICOS),
        ],
      },
      {
        level: 5,
        label: "Cruzando cuerdas por todo el mástil",
        build: () => [
          ...sameStringPairs(ALL_STRINGS, 12, TODOS),
          // paso más ancho: con los doce intervalos en las cinco parejas de
          // cuerdas, un paso de 5 se va de las 300 tarjetas y el nivel deja
          // de poder estudiarse
          ...crossStringPairs(ALL_STRINGS, 12, TODOS, 6),
        ],
      },
    ],
  },

  {
    slug: "construir-intervalos",
    title: "Construir intervalos",
    summary:
      "Al revés que el anterior: te da una nota y un intervalo, y tú tocas la nota que queda a esa distancia. Vale cualquier sitio del mástil donde esté esa altura.",
    theme: "intervalos",
    skills: ["construir-intervalos", "octavas"],
    mode: "identificar",
    levels: [
      {
        level: 1,
        label: "Quinta justa y octava",
        build: () => buildTargets([0, 1], 12, [IV.quinta, IV.octava]),
      },
      {
        level: 2,
        label: "Terceras, cuarta y quinta",
        build: () =>
          buildTargets([0, 1, 2], 12, [
            IV.terceraMenor,
            IV.terceraMayor,
            IV.cuarta,
            IV.quinta,
          ]),
      },
      {
        level: 3,
        label: "Todos los diatónicos",
        build: () => buildTargets(ALL_STRINGS, 12, DIATONICOS),
      },
      {
        level: 4,
        label: "Todos, tritono incluido",
        build: () => buildTargets(ALL_STRINGS, 12, TODOS),
      },
    ],
  },

  {
    slug: "notas-del-acorde",
    title: "Notas del acorde",
    summary:
      "Un cifrado y las doce notas: marca las que forman el acorde. Es la diferencia entre saber la forma y saber el acorde.",
    theme: "acordes",
    skills: ["notas-del-acorde", "inversiones"],
    mode: "identificar",
    levels: [
      {
        level: 1,
        label: "Tríadas mayores y menores",
        build: () => chordCards(ROOTS_BASICAS, ["major", "minor"]),
      },
      {
        level: 2,
        label: "Con disminuidos, aumentados y suspendidos",
        build: () =>
          chordCards(ROOTS_BASICAS, [
            "major",
            "minor",
            "diminished",
            "augmented",
            "sus2",
            "sus4",
          ]),
      },
      {
        level: 3,
        label: "Séptimas en las doce tonalidades",
        build: () => chordCards(ROOTS_TODAS, ["maj7", "7", "m7", "m7b5"]),
      },
      {
        level: 4,
        label: "Séptimas, sextas y novenas",
        build: () =>
          chordCards(ROOTS_TODAS, ["maj7", "7", "m7", "m7b5", "dim7", "6", "m6", "9"]),
      },
      {
        level: 5,
        label: "Con dominantes alterados",
        build: () =>
          chordCards(ROOTS_TODAS, [
            "maj7",
            "7",
            "m7",
            "m7b5",
            "dim7",
            "6",
            "m6",
            "9",
            "7b9",
            "7#9",
            "7b5",
            "7#5",
            "13",
          ]),
      },
    ],
  },

  {
    slug: "grados-de-la-escala",
    title: "Grados de la escala",
    summary:
      "Una nota marcada dentro de una escala: di qué grado es. Es el paso que separa recorrer una caja de saber qué estás tocando, y sin él no hay improvisación posible.",
    theme: "escalas",
    skills: ["grados-de-la-escala", "digitaciones"],
    mode: "identificar",
    levels: [
      {
        level: 1,
        label: "Pentatónica menor, caja 1",
        build: () => degreeCards(["A", "E"], ["minor-pentatonic"], [1]),
      },
      {
        level: 2,
        label: "Las dos pentatónicas, cajas 1 y 2",
        build: () =>
          degreeCards(["A", "E", "G"], ["minor-pentatonic", "major-pentatonic"], [1, 2]),
      },
      {
        level: 3,
        label: "Mayor y menor natural",
        build: () => degreeCards(["C", "A", "G"], ["major", "natural-minor"], [1, 2]),
      },
      {
        level: 4,
        label: "Los modos y el blues",
        build: () =>
          degreeCards(
            ["A", "E", "G"],
            ["dorian", "mixolydian", "blues", "natural-minor"],
            [1, 2],
          ),
      },
      {
        level: 5,
        label: "Armónica, melódica, alterada y los modos raros",
        build: () =>
          degreeCards(
            ["A", "E"],
            [
              "harmonic-minor",
              "melodic-minor",
              "altered",
              "lydian",
              "phrygian",
              "locrian",
            ],
            [1, 2],
          ),
      },
    ],
  },

  {
    slug: "cajas-de-escala",
    title: "Completar la caja",
    summary:
      "Se dibuja una caja con un hueco y tú tocas la nota que falta. Se entrena la forma, no la nota: la misma altura en otra cuerda no vale.",
    theme: "escalas",
    skills: ["digitaciones", "grados-de-la-escala"],
    mode: "identificar",
    levels: [
      {
        level: 1,
        label: "Pentatónica menor, cajas 1 y 2",
        build: () => boxCards(["A"], ["minor-pentatonic"], [1, 2]),
      },
      {
        level: 2,
        label: "Las cinco cajas, en La y en Mi",
        build: () => boxCards(["A", "E"], ["minor-pentatonic"]),
      },
      {
        level: 3,
        label: "Las dos pentatónicas y el blues",
        build: () => boxCards(["A"], ["minor-pentatonic", "major-pentatonic", "blues"]),
      },
      {
        level: 4,
        label: "Mayor y menor natural, siete cajas",
        build: () => boxCards(["A"], ["major", "natural-minor"]),
      },
      {
        level: 5,
        label: "Los cuatro modos, cajas 1 a 4",
        build: () =>
          boxCards(["A"], ["dorian", "mixolydian", "lydian", "phrygian"], [1, 2, 3, 4]),
      },
    ],
  },

  {
    slug: "intervalos-de-oido",
    title: "Intervalos de oído",
    summary:
      "Suenan dos notas y dices qué intervalo era. La nota de partida cambia cada vez a propósito: lo que se entrena es la distancia, no la nota.",
    theme: "oido",
    skills: ["oido-relativo", "reconocer-intervalos"],
    mode: "escuchar",
    levels: [
      {
        level: 1,
        label: "Octava, quinta y cuarta",
        build: () =>
          [IV.octava, IV.quinta, IV.cuarta].map((semitones) => ({
            type: "ear_interval" as const,
            semitones,
          })),
      },
      {
        level: 2,
        label: "Con las dos terceras",
        build: () =>
          [IV.octava, IV.quinta, IV.cuarta, IV.terceraMayor, IV.terceraMenor].map(
            (semitones) => ({ type: "ear_interval" as const, semitones }),
          ),
      },
      {
        level: 3,
        label: "Todos los diatónicos",
        build: () =>
          DIATONICOS.map((semitones) => ({ type: "ear_interval" as const, semitones })),
      },
      {
        level: 4,
        label: "Los doce, con segundas menores y tritono",
        build: () =>
          TODOS.map((semitones) => ({ type: "ear_interval" as const, semitones })),
      },
    ],
  },

  {
    slug: "acordes-de-oido",
    title: "Acordes de oído",
    summary:
      "Suena un acorde y dices de qué tipo es. Mayor o menor primero; luego la cara que pone cada séptima.",
    theme: "oido",
    skills: ["oido-armonico", "reconocer-formas"],
    mode: "escuchar",
    levels: [
      {
        level: 1,
        label: "Mayor o menor",
        build: () =>
          ["major", "minor"].map((chordId) => ({ type: "ear_chord" as const, chordId })),
      },
      {
        level: 2,
        label: "Con disminuido, aumentado y suspendidos",
        build: () =>
          ["major", "minor", "diminished", "augmented", "sus2", "sus4"].map(
            (chordId) => ({
              type: "ear_chord" as const,
              chordId,
            }),
          ),
      },
      {
        level: 3,
        label: "Las cuatro séptimas",
        build: () =>
          [
            "major",
            "minor",
            "diminished",
            "augmented",
            "sus4",
            "maj7",
            "7",
            "m7",
            "m7b5",
          ].map((chordId) => ({ type: "ear_chord" as const, chordId })),
      },
      {
        level: 4,
        label: "Con sextas, novenas y dim7",
        build: () =>
          [
            "major",
            "minor",
            "diminished",
            "augmented",
            "sus2",
            "sus4",
            "maj7",
            "7",
            "m7",
            "m7b5",
            "dim7",
            "6",
            "m6",
            "9",
          ].map((chordId) => ({ type: "ear_chord" as const, chordId })),
      },
    ],
  },
];

export function getDrill(slug: string): Drill | undefined {
  return DRILLS.find((d) => d.slug === slug);
}

/** El nivel pedido, o el primero disponible si ese entrenamiento no lo tiene. */
export function drillLevel(drill: Drill, level: TrainLevel): DrillLevel {
  return drill.levels.find((l) => l.level === level) ?? drill.levels[0];
}

/**
 * Los entrenamientos que sirven para unas destrezas dadas, del que más
 * comparte al que menos. Es lo que conecta una ficha de ejercicio —o un
 * bloque de una lección— con su versión interactiva sin escribir el enlace a
 * mano en el contenido: cambiar las destrezas de un ejercicio recoloca solo
 * a dónde apunta.
 */
export function drillsForSkills(skills: readonly TrainSkill[]): Drill[] {
  const buscadas = new Set(skills);
  if (buscadas.size === 0) return [];
  return DRILLS.map((drill, orden) => ({
    drill,
    orden,
    comunes: drill.skills.filter((s) => buscadas.has(s)).length,
  }))
    .filter((x) => x.comunes > 0)
    .sort((a, b) => b.comunes - a.comunes || a.orden - b.orden)
    .map((x) => x.drill);
}

export interface DrillFilters {
  theme?: TrainTheme;
  skill?: TrainSkill;
  mode?: TrainMode;
  level?: TrainLevel;
}

export function filterDrills(
  drills: readonly Drill[],
  { theme, skill, mode, level }: DrillFilters,
): Drill[] {
  return drills.filter(
    (d) =>
      (!theme || d.theme === theme) &&
      (!skill || d.skills.includes(skill)) &&
      (!mode || d.mode === mode) &&
      (!level || d.levels.some((l) => l.level === level)),
  );
}
