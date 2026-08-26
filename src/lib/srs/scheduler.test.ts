import { describe, expect, it } from "vitest";
import {
  dueDate,
  MIN_EASE,
  MAX_EASE,
  NEW_CARD,
  RELEARN_INTERVAL,
  review,
  selectSession,
  sessionStats,
  type CardState,
} from "./scheduler";

const DAY = 24 * 60 * 60 * 1000;

describe("review — primera vez", () => {
  it("acertar una tarjeta nueva la manda a mañana", () => {
    const next = review(NEW_CARD, "good");
    expect(next.intervalDays).toBe(1);
    expect(next.reps).toBe(1);
    expect(next.ease).toBeGreaterThan(NEW_CARD.ease);
  });

  it("si cuesta, vuelve dentro de la misma sesión", () => {
    const next = review(NEW_CARD, "hard");
    expect(next.intervalDays).toBe(RELEARN_INTERVAL);
    expect(next.reps).toBe(1);
    expect(next.ease).toBeLessThan(NEW_CARD.ease);
  });

  it("fallar una tarjeta nueva no cuenta como lapso", () => {
    const next = review(NEW_CARD, "again");
    expect(next.reps).toBe(0);
    expect(next.lapses).toBe(0);
    expect(next.intervalDays).toBe(RELEARN_INTERVAL);
  });
});

describe("review — progresión", () => {
  it("acertando crece 1 → 3 → intervalo por ease", () => {
    let card = review(NEW_CARD, "good");
    expect(card.intervalDays).toBe(1);
    card = review(card, "good");
    expect(card.intervalDays).toBe(3);
    card = review(card, "good");
    expect(card.intervalDays).toBeGreaterThan(3);
    expect(card.reps).toBe(3);
  });

  it("'cuesta' crece más despacio que 'bien'", () => {
    const base: CardState = { intervalDays: 10, ease: 2.5, reps: 3, lapses: 0 };
    expect(review(base, "hard").intervalDays).toBeLessThan(
      review(base, "good").intervalDays,
    );
  });

  it("fallar una tarjeta consolidada suma lapso y la devuelve al principio", () => {
    const mature: CardState = { intervalDays: 30, ease: 2.5, reps: 5, lapses: 1 };
    const next = review(mature, "again");
    expect(next.reps).toBe(0);
    expect(next.lapses).toBe(2);
    expect(next.intervalDays).toBe(RELEARN_INTERVAL);
  });
});

describe("review — ease acotada", () => {
  it("nunca baja del suelo por muchos fallos", () => {
    let card = NEW_CARD;
    for (let i = 0; i < 20; i++) card = review(card, "again");
    expect(card.ease).toBe(MIN_EASE);
  });

  it("nunca sube del techo por muchos aciertos", () => {
    let card = NEW_CARD;
    for (let i = 0; i < 20; i++) card = review(card, "good");
    expect(card.ease).toBeLessThanOrEqual(MAX_EASE);
  });
});

describe("dueDate", () => {
  it("convierte el intervalo en un instante futuro", () => {
    const now = Date.parse("2026-08-26T10:00:00Z");
    expect(dueDate({ ...NEW_CARD, intervalDays: 1 }, now)).toBe(now + DAY);
    expect(dueDate({ ...NEW_CARD, intervalDays: 0 }, now)).toBe(now);
  });
});

describe("selectSession", () => {
  const now = Date.parse("2026-08-26T10:00:00Z");
  const deck = [
    { card: "vencida-hace-3d", dueAt: now - 3 * DAY, reps: 4 },
    { card: "vencida-hoy", dueAt: now - 1000, reps: 2 },
    { card: "futura", dueAt: now + 5 * DAY, reps: 3 },
    { card: "nueva-1", dueAt: now, reps: 0 },
    { card: "nueva-2", dueAt: now, reps: 0 },
  ];

  it("prioriza lo vencido, lo más atrasado primero", () => {
    expect(selectSession(deck, now, 2)).toEqual(["vencida-hace-3d", "vencida-hoy"]);
  });

  it("rellena con tarjetas nuevas cuando falta", () => {
    expect(selectSession(deck, now, 4)).toEqual([
      "vencida-hace-3d",
      "vencida-hoy",
      "nueva-1",
      "nueva-2",
    ]);
  });

  it("nunca incluye tarjetas que aún no tocan", () => {
    expect(selectSession(deck, now, 10)).not.toContain("futura");
  });

  it("con mazo vacío devuelve sesión vacía", () => {
    expect(selectSession([], now, 10)).toEqual([]);
  });
});

describe("sessionStats", () => {
  it("cuenta vencidas y nuevas por separado", () => {
    const now = Date.parse("2026-08-26T10:00:00Z");
    const stats = sessionStats(
      [
        { card: "a", dueAt: now - DAY, reps: 3 },
        { card: "b", dueAt: now + DAY, reps: 3 },
        { card: "c", dueAt: now, reps: 0 },
      ],
      now,
    );
    expect(stats).toEqual({ due: 1, fresh: 1, total: 3 });
  });
});
