import { describe, expect, it } from "vitest";
import {
  assessmentProgress,
  isModuleAssessmentComplete,
  isQuizComplete,
  scoreQuiz,
  type QuizQuestion,
} from "./scoring";

const QUESTIONS: QuizQuestion[] = [
  { q: "1?", options: ["a", "b"], answer: 0 },
  { q: "2?", options: ["a", "b"], answer: 1 },
  { q: "3?", options: ["a", "b"], answer: 1 },
  { q: "4?", options: ["a", "b"], answer: 0 },
  { q: "5?", options: ["a", "b"], answer: 0 },
];

describe("scoreQuiz", () => {
  it("cuenta aciertos y calcula la nota", () => {
    const result = scoreQuiz(QUESTIONS, { 0: 0, 1: 1, 2: 1, 3: 0, 4: 1 }, 0.8);
    expect(result.correct).toBe(4);
    expect(result.score).toBe(0.8);
    expect(result.wrong).toEqual([4]);
  });

  it("aprueba justo en el umbral", () => {
    expect(scoreQuiz(QUESTIONS, { 0: 0, 1: 1, 2: 1, 3: 0, 4: 1 }, 0.8).passed).toBe(true);
  });

  it("suspende por debajo del umbral", () => {
    expect(scoreQuiz(QUESTIONS, { 0: 1, 1: 1, 2: 1, 3: 0, 4: 1 }, 0.8).passed).toBe(
      false,
    );
  });

  it("no aprueba si quedan preguntas sin responder, aunque el resto sean aciertos", () => {
    const result = scoreQuiz(QUESTIONS, { 0: 0, 1: 1, 2: 1, 3: 0 }, 0.8);
    expect(result.correct).toBe(4);
    expect(result.answered).toBe(4);
    expect(result.passed).toBe(false);
  });

  it("un quiz en blanco puntúa cero sin romperse", () => {
    const result = scoreQuiz(QUESTIONS, {}, 0.8);
    expect(result).toMatchObject({ correct: 0, answered: 0, score: 0, passed: false });
  });

  it("sin preguntas no divide por cero", () => {
    expect(scoreQuiz([], {}, 0.8).score).toBe(0);
  });

  it("el pleno da 1", () => {
    const perfect = scoreQuiz(QUESTIONS, { 0: 0, 1: 1, 2: 1, 3: 0, 4: 0 }, 0.8);
    expect(perfect.score).toBe(1);
    expect(perfect.wrong).toEqual([]);
  });
});

describe("isQuizComplete", () => {
  it("detecta si falta alguna", () => {
    expect(isQuizComplete(QUESTIONS, { 0: 0, 1: 1, 2: 1, 3: 0 })).toBe(false);
    expect(isQuizComplete(QUESTIONS, { 0: 0, 1: 1, 2: 1, 3: 0, 4: 0 })).toBe(true);
  });

  it("acepta la opción 0 como respuesta válida", () => {
    expect(isQuizComplete([QUESTIONS[0]], { 0: 0 })).toBe(true);
  });
});

describe("evaluación de módulo", () => {
  const full = {
    quizPassed: true,
    checklistDone: 4,
    checklistTotal: 4,
    hasRecording: true,
  };

  it("se supera con las tres patas", () => {
    expect(isModuleAssessmentComplete(full)).toBe(true);
  });

  it("falla si falta cualquiera de ellas", () => {
    expect(isModuleAssessmentComplete({ ...full, quizPassed: false })).toBe(false);
    expect(isModuleAssessmentComplete({ ...full, checklistDone: 3 })).toBe(false);
    expect(isModuleAssessmentComplete({ ...full, hasRecording: false })).toBe(false);
  });

  it("el progreso pondera las tres partes por igual", () => {
    expect(assessmentProgress(full)).toBe(1);
    expect(
      assessmentProgress({
        quizPassed: true,
        checklistDone: 2,
        checklistTotal: 4,
        hasRecording: false,
      }),
    ).toBeCloseTo(0.5);
    expect(
      assessmentProgress({
        quizPassed: false,
        checklistDone: 0,
        checklistTotal: 4,
        hasRecording: false,
      }),
    ).toBe(0);
  });
});
