export interface TuningDef {
  id: string;
  name: string;
  /**
   * Notas MIDI de cada cuerda, de la 6ª (grave) a la 1ª (aguda).
   * Estándar: E2=40, A2=45, D3=50, G3=55, B3=59, E4=64.
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
    name: "Medio tono abajo (Eb estándar)",
    midi: [39, 44, 49, 54, 58, 63],
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
};

export type TuningId = keyof typeof TUNINGS;

export function getTuning(id: string): TuningDef {
  const tuning = TUNINGS[id];
  if (!tuning) throw new Error(`Afinación desconocida: "${id}"`);
  return tuning;
}
