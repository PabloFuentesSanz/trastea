/**
 * Vocabulario cerrado del centro de entrenamiento.
 *
 * Tres ejes por los que se navega: **de qué va** (tema), **qué músculo o qué
 * conocimiento entrena** (destreza) y **cómo se practica** (modalidad). Más el
 * nivel, que es el mismo 1-5 del repertorio.
 *
 * Al ser enums, un entrenamiento que invente un valor no compila, y los
 * filtros no dependen de cadenas sueltas.
 */

// ---------- temas ----------

const THEME_LABELS = {
  diapason: "Diapasón",
  intervalos: "Intervalos",
  acordes: "Acordes",
  escalas: "Escalas",
  oido: "Oído",
  tecnica: "Técnica",
  ritmo: "Ritmo",
  aplicacion: "Aplicación",
} as const satisfies Record<string, string>;

export type TrainTheme = keyof typeof THEME_LABELS;

export const TRAIN_THEMES = Object.keys(THEME_LABELS) as TrainTheme[];
export const TRAIN_THEME_LABEL: Record<TrainTheme, string> = THEME_LABELS;

// ---------- destrezas: "qué quiero practicar" ----------

const SKILL_LABELS = {
  // diapasón
  "nombres-de-notas": "Nombres de las notas",
  octavas: "Octavas",
  enarmonias: "Enarmonías",
  // intervalos
  "reconocer-intervalos": "Reconocer intervalos",
  "construir-intervalos": "Construir intervalos",
  // acordes
  "notas-del-acorde": "Notas del acorde",
  "reconocer-formas": "Reconocer formas",
  inversiones: "Inversiones",
  "cambios-de-acorde": "Cambios de acorde",
  // escalas
  "grados-de-la-escala": "Grados de la escala",
  digitaciones: "Digitaciones",
  // oído
  "oido-relativo": "Oído relativo",
  "oido-armonico": "Oído armónico",
  afinacion: "Afinación",
  // técnica
  "pua-alterna": "Púa alterna",
  "sweep-picking": "Sweep picking",
  "hybrid-picking": "Hybrid picking",
  legato: "Legato",
  tapping: "Tapping",
  "string-skipping": "String skipping",
  movilidad: "Movilidad de dedos",
  "sincronia-manos": "Sincronía entre manos",
  estiramiento: "Estiramiento",
  "palm-mute": "Palm mute",
  rasgueo: "Rasgueo",
  bending: "Bending y vibrato",
  fingerstyle: "Fingerstyle",
  // aplicación: tocar música de verdad con lo aprendido
  improvisacion: "Improvisación",
  fraseo: "Fraseo",
  acompanamiento: "Acompañamiento",
  transcripcion: "Transcripción",
  // ritmo
  subdivision: "Subdivisión",
  sincopa: "Síncopa",
  "metricas-impares": "Métricas impares",
  independencia: "Independencia",
} as const satisfies Record<string, string>;

export type TrainSkill = keyof typeof SKILL_LABELS;

export const TRAIN_SKILLS = Object.keys(SKILL_LABELS) as TrainSkill[];
export const TRAIN_SKILL_LABEL: Record<TrainSkill, string> = SKILL_LABELS;

// ---------- modalidades ----------

const MODE_LABELS = {
  /** pregunta y respuesta, con repetición espaciada */
  identificar: "Identificar",
  /** te lo tocan y respondes: aquí no se mira, se escucha */
  escuchar: "Escuchar",
  /** con el instrumento en la mano, metrónomo y cronómetro */
  cronometrado: "Cronometrado",
  /** se sigue la ficha a tu ritmo: cantar, transcribir, recorrer el mástil */
  guiado: "Guiado",
} as const satisfies Record<string, string>;

export type TrainMode = keyof typeof MODE_LABELS;

export const TRAIN_MODES = Object.keys(MODE_LABELS) as TrainMode[];
export const TRAIN_MODE_LABEL: Record<TrainMode, string> = MODE_LABELS;

/** Una frase por modalidad, para que el hub explique qué vas a hacer. */
export const TRAIN_MODE_HINT: Record<TrainMode, string> = {
  identificar: "Responde y el sistema repite lo que peor llevas",
  escuchar: "Suena y tú dices qué era. Con auriculares mejor",
  cronometrado: "Con la guitarra: metrónomo, cronómetro y bpm que sube",
  guiado: "Sigues la ficha a tu ritmo, sin tempo que perseguir",
};

// ---------- niveles ----------

export type TrainLevel = 1 | 2 | 3 | 4 | 5;

export const TRAIN_LEVELS: readonly TrainLevel[] = [1, 2, 3, 4, 5];

export const TRAIN_LEVEL_LABEL: Record<TrainLevel, string> = {
  1: "Principiante",
  2: "Iniciado",
  3: "Intermedio",
  4: "Avanzado",
  5: "Exigente",
};

// ---------- guardas ----------

export function isTrainTheme(value: string): value is TrainTheme {
  return value in THEME_LABELS;
}

export function isTrainSkill(value: string): value is TrainSkill {
  return value in SKILL_LABELS;
}

export function isTrainMode(value: string): value is TrainMode {
  return value in MODE_LABELS;
}

export function isTrainLevel(value: number): value is TrainLevel {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

/**
 * Nivel de un ejercicio a partir de la semana del curso en la que aparece por
 * primera vez. No se escribe en la ficha: se deduce, y así reordenar el curso
 * reordena los niveles solo.
 */
export function levelFromWeek(week: number): TrainLevel {
  if (week <= 2) return 1;
  if (week <= 4) return 2;
  if (week <= 7) return 3;
  if (week <= 10) return 4;
  return 5;
}
