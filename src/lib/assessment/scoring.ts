/**
 * Puntuación de quizzes y estado de evaluación de módulo. Puro y testeado.
 */

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  explain?: string;
}

/** Respuestas del usuario: índice de pregunta → índice de opción elegida. */
export type QuizAnswers = Record<number, number>;

export interface QuizResult {
  total: number;
  answered: number;
  correct: number;
  /** 0..1 */
  score: number;
  passed: boolean;
  /** índices de las preguntas falladas, en orden */
  wrong: number[];
}

export function scoreQuiz(
  questions: readonly QuizQuestion[],
  answers: QuizAnswers,
  passScore: number,
): QuizResult {
  const total = questions.length;
  const wrong: number[] = [];
  let correct = 0;
  let answered = 0;

  questions.forEach((question, index) => {
    const given = answers[index];
    if (given === undefined) return;
    answered += 1;
    if (given === question.answer) correct += 1;
    else wrong.push(index);
  });

  const score = total === 0 ? 0 : correct / total;
  return {
    total,
    answered,
    correct,
    score,
    // Solo se aprueba con el quiz entero respondido
    passed: answered === total && score >= passScore,
    wrong,
  };
}

/** Solo mira que haya una respuesta por pregunta: sirve también en cliente,
 *  donde las preguntas viajan sin la respuesta correcta. */
export function isQuizComplete(
  questions: readonly unknown[],
  answers: QuizAnswers,
): boolean {
  return questions.every((_, index) => answers[index] !== undefined);
}

export interface ModuleAssessmentState {
  quizPassed: boolean;
  checklistDone: number;
  checklistTotal: number;
  hasRecording: boolean;
}

/**
 * La evaluación de módulo se supera con las tres patas: quiz aprobado,
 * checklist entera y al menos una grabación.
 */
export function isModuleAssessmentComplete(state: ModuleAssessmentState): boolean {
  return (
    state.quizPassed &&
    state.checklistTotal > 0 &&
    state.checklistDone === state.checklistTotal &&
    state.hasRecording
  );
}

/** Progreso global de la evaluación, 0..1, para la barra de la UI. */
export function assessmentProgress(state: ModuleAssessmentState): number {
  const parts = [
    state.quizPassed ? 1 : 0,
    state.checklistTotal === 0 ? 0 : state.checklistDone / state.checklistTotal,
    state.hasRecording ? 1 : 0,
  ];
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}
