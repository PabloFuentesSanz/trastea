export interface TuningDef {
  id: string;
  name: string;
  /**
   * Notas MIDI de cada cuerda, de la 6ª (grave) a la 1ª (aguda).
   * Estándar: E2=40, A2=45, D3=50, G3=55, B3=59, E4=64.
   *
   * El nombre lleva el deletreo entre paréntesis y `tunings.test.ts`
   * comprueba que coincide con estos números: un MIDI mal tecleado daría una
   * afinación con el nombre bien y las notas mal, y el afinador mandaría a
   * quien lo use a otra nota.
   */
  midi: readonly number[];
}

export const TUNINGS: Record<string, TuningDef> = {
  standard: {
    id: "standard",
    name: "Estándar (EADGBE)",
    midi: [40, 45, 50, 55, 59, 64],
  },
  "drop-d": {
    id: "drop-d",
    name: "Drop D (DADGBE)",
    midi: [38, 45, 50, 55, 59, 64],
  },
  "half-step-down": {
    id: "half-step-down",
    name: "Medio tono abajo (EbAbDbGbBbEb)",
    midi: [39, 44, 49, 54, 58, 63],
  },
  "drop-c": {
    id: "drop-c",
    name: "Drop C (CGCFAD)",
    midi: [36, 43, 48, 53, 57, 62],
  },
  "drop-b": {
    id: "drop-b",
    name: "Drop B (BF#BEG#C#)",
    midi: [35, 42, 47, 52, 56, 61],
  },
  dadgad: {
    id: "dadgad",
    name: "DADGAD",
    midi: [38, 45, 50, 55, 57, 62],
  },
  "open-g": {
    id: "open-g",
    name: "Open G (DGDGBD)",
    midi: [38, 43, 50, 55, 59, 62],
  },
  "open-d": {
    id: "open-d",
    name: "Open D (DADF#AD)",
    midi: [38, 45, 50, 54, 57, 62],
  },
  "open-e": {
    id: "open-e",
    name: "Open E (EBEG#BE)",
    midi: [40, 47, 52, 56, 59, 64],
  },
  "open-c": {
    id: "open-c",
    name: "Open C (CGCGCE)",
    midi: [36, 43, 48, 55, 60, 64],
  },
};

export type TuningId = keyof typeof TUNINGS;

/**
 * Los ids, para poder cerrar el vocabulario del contenido: una canción que
 * declare una afinación que no existe rompe el build en vez de enseñar un
 * botón que lleva a la afinación equivocada.
 */
export const TUNING_IDS = Object.keys(TUNINGS) as [TuningId, ...TuningId[]];

export function getTuning(id: string): TuningDef {
  const tuning = TUNINGS[id];
  if (!tuning) throw new Error(`Afinación desconocida: "${id}"`);
  return tuning;
}
