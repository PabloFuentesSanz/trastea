import type { IntervalName } from "@/lib/music/notes";

export interface ScaleDef {
  id: string;
  name: string;
  intervals: readonly IntervalName[];
  /** Escala de 7 notas de la que deriva (teoría), si aplica */
  parent?: string;
  /**
   * Escala de la que hereda la DIGITACIÓN de las cajas. No siempre coincide
   * con `parent`: el blues deriva teóricamente de la menor natural, pero su
   * caja es la de la pentatónica menor con la b5 metida dentro.
   */
  boxParent?: string;
  category: "mayor" | "menor" | "pentatonica" | "modo" | "sintetica" | "otra";
}

/**
 * Escalas definidas por fórmula de intervalos. Las herramientas calculan las
 * posiciones en el mástil a partir de aquí: añadir una escala = añadir una entrada.
 */
export const SCALES: Record<string, ScaleDef> = {
  major: {
    id: "major",
    name: "Mayor (jónico)",
    intervals: ["1", "2", "3", "4", "5", "6", "7"],
    category: "mayor",
  },
  "natural-minor": {
    id: "natural-minor",
    name: "Menor natural (eólico)",
    intervals: ["1", "2", "b3", "4", "5", "b6", "b7"],
    category: "menor",
  },
  "harmonic-minor": {
    id: "harmonic-minor",
    name: "Menor armónica",
    intervals: ["1", "2", "b3", "4", "5", "b6", "7"],
    category: "menor",
  },
  "melodic-minor": {
    id: "melodic-minor",
    name: "Menor melódica",
    intervals: ["1", "2", "b3", "4", "5", "6", "7"],
    category: "menor",
  },
  "major-pentatonic": {
    id: "major-pentatonic",
    name: "Pentatónica mayor",
    intervals: ["1", "2", "3", "5", "6"],
    parent: "major",
    category: "pentatonica",
  },
  "minor-pentatonic": {
    id: "minor-pentatonic",
    name: "Pentatónica menor",
    intervals: ["1", "b3", "4", "5", "b7"],
    parent: "natural-minor",
    category: "pentatonica",
  },
  blues: {
    id: "blues",
    name: "Blues",
    intervals: ["1", "b3", "4", "b5", "5", "b7"],
    parent: "natural-minor",
    boxParent: "minor-pentatonic",
    category: "otra",
  },
  dorian: {
    id: "dorian",
    name: "Dórico",
    intervals: ["1", "2", "b3", "4", "5", "6", "b7"],
    category: "modo",
  },
  phrygian: {
    id: "phrygian",
    name: "Frigio",
    intervals: ["1", "b2", "b3", "4", "5", "b6", "b7"],
    category: "modo",
  },
  lydian: {
    id: "lydian",
    name: "Lidio",
    intervals: ["1", "2", "3", "#4", "5", "6", "7"],
    category: "modo",
  },
  mixolydian: {
    id: "mixolydian",
    name: "Mixolidio",
    intervals: ["1", "2", "3", "4", "5", "6", "b7"],
    category: "modo",
  },
  locrian: {
    id: "locrian",
    name: "Locrio",
    intervals: ["1", "b2", "b3", "4", "b5", "b6", "b7"],
    category: "modo",
  },
  "bebop-dominant": {
    id: "bebop-dominant",
    name: "Bebop dominante",
    intervals: ["1", "2", "3", "4", "5", "6", "b7", "7"],
    category: "sintetica",
  },
  "bebop-major": {
    id: "bebop-major",
    name: "Bebop mayor",
    intervals: ["1", "2", "3", "4", "5", "b6", "6", "7"],
    category: "sintetica",
  },
  chromatic: {
    id: "chromatic",
    name: "Cromática",
    intervals: ["1", "b2", "2", "b3", "3", "4", "b5", "5", "b6", "6", "b7", "7"],
    category: "otra",
  },
};

export type ScaleId = keyof typeof SCALES;

export function getScale(id: string): ScaleDef {
  const scale = SCALES[id];
  if (!scale) throw new Error(`Escala desconocida: "${id}"`);
  return scale;
}
