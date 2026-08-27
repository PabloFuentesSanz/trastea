import { describe, expect, it } from "vitest";
import { bpmLadder, formatClock, nextBpm, practiceSummary } from "./practice";

describe("formatClock", () => {
  it("cuenta en minutos y segundos", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(9)).toBe("0:09");
    expect(formatClock(65)).toBe("1:05");
    expect(formatClock(600)).toBe("10:00");
  });

  it("no enseña números negativos aunque le den uno", () => {
    expect(formatClock(-5)).toBe("0:00");
  });

  it("pasa de la hora sin romperse", () => {
    expect(formatClock(3725)).toBe("62:05");
  });
});

describe("bpmLadder", () => {
  it("va del inicio al objetivo en pasos de cinco", () => {
    expect(bpmLadder(60, 80)).toEqual([60, 65, 70, 75, 80]);
  });

  it("incluye siempre el objetivo, aunque no caiga en el paso", () => {
    expect(bpmLadder(60, 82)).toEqual([60, 65, 70, 75, 80, 82]);
  });

  it("con inicio y objetivo iguales, un solo escalón", () => {
    expect(bpmLadder(80, 80)).toEqual([80]);
  });

  it("si el objetivo es menor que el inicio, no inventa una escalera al revés", () => {
    expect(bpmLadder(100, 80)).toEqual([100]);
  });

  it("no se hace infinita con objetivos lejanos", () => {
    const escalera = bpmLadder(40, 300);
    expect(escalera.length).toBeLessThanOrEqual(40);
    expect(escalera[escalera.length - 1]).toBe(300);
  });
});

describe("nextBpm", () => {
  it("sube cinco al acertar limpio", () => {
    expect(nextBpm(80, true, 120)).toBe(85);
  });

  it("no pasa del objetivo", () => {
    expect(nextBpm(118, true, 120)).toBe(120);
    expect(nextBpm(120, true, 120)).toBe(120);
  });

  it("baja al fallar, pero nunca por debajo del suelo", () => {
    expect(nextBpm(80, false, 120)).toBe(75);
    expect(nextBpm(22, false, 120)).toBe(20);
  });
});

describe("practiceSummary", () => {
  it("sin intentos lo dice, no enseña un cero", () => {
    const r = practiceSummary({ seconds: 0, attempts: [] });
    expect(r.headline).toMatch(/sin registrar/i);
  });

  it("resume el tiempo y el mejor bpm limpio", () => {
    const r = practiceSummary({
      seconds: 310,
      attempts: [
        { bpm: 80, clean: true },
        { bpm: 90, clean: false },
        { bpm: 85, clean: true },
      ],
    });
    expect(r.minutes).toBe(5);
    expect(r.bestClean).toBe(85);
    expect(r.headline).toContain("85");
  });

  it("un bpm alto pero sucio no cuenta como mejor marca", () => {
    const r = practiceSummary({
      seconds: 60,
      attempts: [
        { bpm: 200, clean: false },
        { bpm: 70, clean: true },
      ],
    });
    expect(r.bestClean).toBe(70);
  });

  it("si nada salió limpio, no miente con una marca", () => {
    const r = practiceSummary({ seconds: 60, attempts: [{ bpm: 90, clean: false }] });
    expect(r.bestClean).toBeNull();
    expect(r.headline).toMatch(/limpio/i);
  });

  it("redondea al minuto más cercano: 5:10 son 5 minutos, no 6", () => {
    expect(practiceSummary({ seconds: 310, attempts: [] }).minutes).toBe(5);
  });

  it("pero medio minuto tocando cuenta como uno: no se pierde la práctica corta", () => {
    expect(practiceSummary({ seconds: 20, attempts: [] }).minutes).toBe(1);
    expect(practiceSummary({ seconds: 0, attempts: [] }).minutes).toBe(0);
  });
});
