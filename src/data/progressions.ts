/**
 * Formas sobre las que se practica. Cada una está escrita en un tono de
 * referencia y se transporta a cualquier otro (src/lib/music/transpose.ts).
 *
 * Datos, no contenido: aquí no hay pedagogía ni texto de curso, solo la
 * rejilla y de qué va. Lo que se enseña sobre cada una vive en /content.
 */

import type { BackingStyle } from "@/lib/backing/groove";
import type { NoteName } from "@/lib/music/notes";

export interface Progression {
  id: string;
  name: string;
  /** de qué sirve practicarla, en una línea */
  summary: string;
  /** tono en el que está escrita la rejilla */
  key: NoteName;
  grid: string;
  style: BackingStyle;
  bpm: number;
  family: "blues" | "jazz" | "modal" | "pop" | "ejercicio";
}

export const PROGRESSIONS: Progression[] = [
  {
    id: "blues-12",
    name: "Blues de 12",
    summary: "La forma más tocada de la historia. Tres acordes y todo el vocabulario.",
    key: "A",
    grid: "A7 | A7 | A7 | A7 | D7 | D7 | A7 | A7 | E7 | D7 | A7 | E7",
    style: "shuffle",
    bpm: 80,
    family: "blues",
  },
  {
    id: "blues-quick-change",
    name: "Blues con quick change",
    summary: "El IV asoma en el compás 2. Es la versión que se toca en las jams.",
    key: "A",
    grid: "A7 | D7 | A7 | A7 | D7 | D7 | A7 | A7 | E7 | D7 | A7 | E7",
    style: "shuffle",
    bpm: 84,
    family: "blues",
  },
  {
    id: "blues-jazz",
    name: "Blues jazz",
    summary: "Con su ii-V en los compases 9-10 y el turnaround del final.",
    key: "F",
    grid: "F7 | Bb7 | F7 | Cm7 F7 | Bb7 | Bb7 | F7 | Am7 D7 | Gm7 | C7 | F7 D7 | Gm7 C7",
    style: "swing",
    bpm: 76,
    family: "blues",
  },
  {
    id: "blues-lento",
    name: "Blues lento en 12/8",
    summary: "A este tempo no hay dónde esconderse: el mejor profesor de fraseo.",
    key: "C",
    grid: "C7 | F7 | C7 | C7 | F7 | F7 | C7 | C7 | G7 | F7 | C7 | G7",
    style: "shuffle",
    bpm: 56,
    family: "blues",
  },
  {
    id: "ii-v-i",
    name: "ii-V-I mayor",
    summary: "La frase hecha de la música tonal. Cuatro compases en bucle.",
    key: "C",
    grid: "Dm7 | G7 | Cmaj7 | %",
    style: "swing",
    bpm: 76,
    family: "jazz",
  },
  {
    id: "ii-v-i-menor",
    name: "ii-V-i menor",
    summary: "Con el m7b5 que anuncia la resolución. El otro medio del jazz.",
    key: "C",
    grid: "Dm7b5 | G7 | Cm7 | %",
    style: "swing",
    bpm: 76,
    family: "jazz",
  },
  {
    id: "ii-v-i-ciclo",
    name: "ii-V-I por el ciclo",
    summary: "El mismo ii-V-I bajando de cuarta en cuarta. El gimnasio de acordes.",
    key: "C",
    grid: "Dm7 | G7 | Cmaj7 | % | Gm7 | C7 | Fmaj7 | % | Cm7 | F7 | Bbmaj7 | %",
    style: "swing",
    bpm: 72,
    family: "jazz",
  },
  {
    id: "rhythm-changes-a",
    name: "Rhythm changes (sección A)",
    summary: "La segunda forma más tocada del jazz, después del blues.",
    key: "Bb",
    grid: "Bbmaj7 Gm7 | Cm7 F7 | Dm7 G7 | Cm7 F7 | Bbmaj7 Gm7 | Cm7 F7 | Bbmaj7 | %",
    style: "swing",
    bpm: 84,
    family: "jazz",
  },
  {
    id: "vamp-dorico",
    name: "Vamp dórico",
    summary: "Un acorde y todo el tiempo del mundo. Para frasear sin prisa.",
    key: "D",
    grid: "Dm7 | % | % | %",
    style: "swing",
    bpm: 88,
    family: "modal",
  },
  {
    id: "vamp-menor",
    name: "Vamp menor con bVII",
    summary: "El pedal de rock y de soul: i - bVII, y a improvisar.",
    key: "A",
    grid: "Am7 | G | Am7 | G",
    style: "recto",
    bpm: 90,
    family: "modal",
  },
  {
    id: "vamp-funk",
    name: "Vamp de funk",
    summary: "Un acorde de novena y un péndulo de semicorcheas.",
    key: "E",
    grid: "E7 | % | A7 | E7",
    style: "funk",
    bpm: 96,
    family: "modal",
  },
  {
    id: "bossa",
    name: "Bossa: ii-V-I con m7b5",
    summary: "La cadencia de Blue Bossa, para practicar el color brasileño.",
    key: "C",
    grid: "Cm7 | Fm7 | Dm7b5 | G7 | Cm7 | %",
    style: "bossa",
    bpm: 92,
    family: "jazz",
  },
  {
    id: "cadencia-pop",
    name: "I - V - vi - IV",
    summary: "La progresión de medio pop de los últimos cincuenta años.",
    key: "C",
    grid: "C | G | Am | F",
    style: "recto",
    bpm: 88,
    family: "pop",
  },
  {
    id: "cadencia-andaluza",
    name: "Cadencia andaluza",
    summary: "Am - G - F - E, reposando en Mi. El sonido del frigio.",
    key: "A",
    grid: "Am | G | F | E",
    style: "recto",
    bpm: 84,
    family: "pop",
  },
  {
    id: "canon",
    name: "Canon (I - V - vi - iii - IV)",
    summary: "La otra progresión infinita, la de Pachelbel.",
    key: "D",
    grid: "D | A | Bm | F#m | G | D | G | A",
    style: "recto",
    bpm: 80,
    family: "pop",
  },
  {
    id: "ciclo-cuartas",
    name: "Ciclo de cuartas (maj7)",
    summary: "Las doce raíces, un acorde por compás. El examen de los shells.",
    key: "C",
    grid:
      "Cmaj7 | Fmaj7 | Bbmaj7 | Ebmaj7 | Abmaj7 | Dbmaj7 | " +
      "Gbmaj7 | Bmaj7 | Emaj7 | Amaj7 | Dmaj7 | Gmaj7",
    style: "swing",
    bpm: 70,
    family: "ejercicio",
  },
  {
    id: "dominantes-ciclo",
    name: "Ciclo de dominantes",
    summary: "Doce acordes de 7ª encadenados por cuartas: el motor del jazz.",
    key: "C",
    grid: "C7 | F7 | Bb7 | Eb7 | Ab7 | Db7 | Gb7 | B7 | E7 | A7 | D7 | G7",
    style: "swing",
    bpm: 72,
    family: "ejercicio",
  },
];

export const FAMILY_LABELS: Record<Progression["family"], string> = {
  blues: "Blues",
  jazz: "Jazz",
  modal: "Modal y vamps",
  pop: "Pop y folk",
  ejercicio: "Ejercicios",
};

export function getProgression(id: string): Progression | undefined {
  return PROGRESSIONS.find((p) => p.id === id);
}
