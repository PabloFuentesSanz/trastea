/**
 * Los intervalos vistos desde el entrenamiento: cómo se llaman, cómo caben en
 * un botón y con qué canción se reconocen de oído.
 *
 * Aquí se cuenta por **semitonos**, no por grados escritos: en el mástil dos
 * posiciones no traen tonalidad consigo, así que el traste 4 sobre el traste 0
 * es una tercera mayor y no hay contexto que lo convierta en cuarta
 * disminuida. Para escritura con enarmonías correctas está `music/notes`.
 */

const LABELS = [
  "Unísono",
  "2ª menor",
  "2ª mayor",
  "3ª menor",
  "3ª mayor",
  "4ª justa",
  "Tritono",
  "5ª justa",
  "6ª menor",
  "6ª mayor",
  "7ª menor",
  "7ª mayor",
  "Octava",
] as const;

const SHORT = [
  "1ª",
  "2m",
  "2M",
  "3m",
  "3M",
  "4J",
  "TT",
  "5J",
  "6m",
  "6M",
  "7m",
  "7M",
  "8ª",
] as const;

const COMPOUND: Record<number, [string, string]> = {
  13: ["9ª menor", "9m"],
  14: ["9ª mayor", "9M"],
  15: ["10ª menor", "10m"],
  16: ["10ª mayor", "10M"],
  17: ["11ª justa", "11J"],
  18: ["11ª aumentada", "11#"],
  19: ["12ª justa", "12J"],
  20: ["13ª menor", "13m"],
  21: ["13ª mayor", "13M"],
  22: ["14ª menor", "14m"],
  23: ["14ª mayor", "14M"],
  24: ["Doble octava", "15ª"],
};

/**
 * La canción con la que se reconoce cada intervalo. Es el método que usa todo
 * el mundo y funciona: cuando dudas, cantas los dos primeros sonidos.
 */
const MNEMONICS: Record<number, string> = {
  0: "La misma nota dos veces",
  1: "Tiburón — las dos notas del tema",
  2: "Cumpleaños feliz — «cum-ple»",
  3: "Smoke on the Water — las dos primeras del riff",
  4: "Oh, When the Saints — «oh, when»",
  5: "La marcha nupcial — «ta-chán»",
  6: "Los Simpson — «The Simp-sons»",
  7: "Star Wars — las dos primeras del tema",
  8: "Love Story — el tema de la película",
  9: "My Bonnie — «my Bon-nie»",
  10: "Star Trek — el salto de la sintonía",
  11: "Take On Me — el salto del estribillo",
  12: "Over the Rainbow — «some-where»",
};

function base(semitones: number): { label: string; short: string } {
  const abs = Math.abs(semitones);
  if (abs <= 12) return { label: LABELS[abs], short: SHORT[abs] };
  const compound = COMPOUND[abs];
  if (compound) return { label: compound[0], short: compound[1] };
  return { label: `${abs} semitonos`, short: `${abs}st` };
}

export function intervalLabel(semitones: number): string {
  const { label } = base(semitones);
  return semitones < 0 ? `${label} descendente` : label;
}

export function intervalShort(semitones: number): string {
  const { short } = base(semitones);
  return semitones < 0 ? `↓${short}` : short;
}

/** La canción de referencia, si el intervalo tiene una consagrada. */
export function intervalMnemonic(semitones: number): string | undefined {
  return MNEMONICS[Math.abs(semitones)];
}

export interface IntervalChoice {
  semitones: number;
  label: string;
  short: string;
}

/** Las trece respuestas posibles dentro de una octava, en orden. */
export const INTERVAL_CHOICES: readonly IntervalChoice[] = Array.from(
  { length: 13 },
  (_, semitones) => ({
    semitones,
    label: intervalLabel(semitones),
    short: intervalShort(semitones),
  }),
);
