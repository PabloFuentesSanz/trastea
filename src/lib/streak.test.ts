import { describe, expect, it } from "vitest";
import { currentStreak, daysBetween, nextStreak } from "./streak";

describe("daysBetween", () => {
  it("cuenta días naturales", () => {
    expect(daysBetween("2026-08-25", "2026-08-26")).toBe(1);
    expect(daysBetween("2026-08-26", "2026-08-26")).toBe(0);
    expect(daysBetween("2026-08-31", "2026-09-01")).toBe(1);
    expect(daysBetween("2026-02-28", "2026-03-01")).toBe(1); // no bisiesto
    expect(daysBetween("2024-02-28", "2024-03-01")).toBe(2); // bisiesto
  });
});

describe("nextStreak", () => {
  it("primera práctica arranca en 1", () => {
    expect(nextStreak({ streakDays: 0, lastPracticeDate: null }, "2026-08-26")).toEqual({
      streakDays: 1,
      lastPracticeDate: "2026-08-26",
    });
  });

  it("misma fecha no suma", () => {
    const state = { streakDays: 3, lastPracticeDate: "2026-08-26" };
    expect(nextStreak(state, "2026-08-26")).toEqual(state);
  });

  it("día consecutivo suma 1", () => {
    expect(
      nextStreak({ streakDays: 3, lastPracticeDate: "2026-08-25" }, "2026-08-26"),
    ).toEqual({ streakDays: 4, lastPracticeDate: "2026-08-26" });
  });

  it("hueco de más de un día reinicia a 1", () => {
    expect(
      nextStreak({ streakDays: 9, lastPracticeDate: "2026-08-23" }, "2026-08-26"),
    ).toEqual({ streakDays: 1, lastPracticeDate: "2026-08-26" });
  });

  it("cruza fin de mes correctamente", () => {
    expect(
      nextStreak({ streakDays: 2, lastPracticeDate: "2026-08-31" }, "2026-09-01"),
    ).toEqual({ streakDays: 3, lastPracticeDate: "2026-09-01" });
  });
});

describe("currentStreak", () => {
  it("sin prácticas es 0", () => {
    expect(currentStreak({ streakDays: 0, lastPracticeDate: null }, "2026-08-26")).toBe(
      0,
    );
  });

  it("practicado hoy o ayer conserva la racha", () => {
    expect(
      currentStreak({ streakDays: 5, lastPracticeDate: "2026-08-26" }, "2026-08-26"),
    ).toBe(5);
    expect(
      currentStreak({ streakDays: 5, lastPracticeDate: "2026-08-25" }, "2026-08-26"),
    ).toBe(5);
  });

  it("dos días sin practicar la muestra rota", () => {
    expect(
      currentStreak({ streakDays: 5, lastPracticeDate: "2026-08-24" }, "2026-08-26"),
    ).toBe(0);
  });
});
