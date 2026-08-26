import { describe, expect, it } from "vitest";
import {
  bpmAfterMeasures,
  bpmFromTaps,
  clampBpm,
  DEFAULT_CONFIG,
  tickAt,
  tickDuration,
  ticksPerMeasure,
  type MetronomeConfig,
} from "./pattern";

const cfg = (partial: Partial<MetronomeConfig>): MetronomeConfig => ({
  ...DEFAULT_CONFIG,
  ...partial,
});

describe("tickDuration", () => {
  it("negra a 60 bpm dura 1s", () => {
    expect(tickDuration(cfg({ bpm: 60 }))).toBe(1);
  });

  it("corcheas a 120 bpm duran 0.25s", () => {
    expect(tickDuration(cfg({ bpm: 120, subdivision: 2 }))).toBe(0.25);
  });

  it("en compás de corchea (6/8) el pulso es la corchea", () => {
    expect(tickDuration(cfg({ bpm: 60, signature: { beats: 6, unit: 8 } }))).toBe(0.5);
  });
});

describe("tickAt", () => {
  it("acentúa el 1 por defecto y clasifica pulsos", () => {
    const c = cfg({});
    expect(tickAt(c, 0).kind).toBe("accent");
    expect(tickAt(c, 1).kind).toBe("beat");
    expect(tickAt(c, 4).measure).toBe(1);
    expect(tickAt(c, 4).kind).toBe("accent");
  });

  it("marca subdivisiones como sub", () => {
    const c = cfg({ subdivision: 2 });
    expect(tickAt(c, 0)).toMatchObject({ beat: 0, sub: 0, kind: "accent" });
    expect(tickAt(c, 1)).toMatchObject({ beat: 0, sub: 1, kind: "sub" });
    expect(tickAt(c, 2)).toMatchObject({ beat: 1, sub: 0, kind: "beat" });
  });

  it("acentos personalizados (1 y 3 en 4/4 → índices 0 y 2)", () => {
    const c = cfg({ accents: [0, 2] });
    expect(tickAt(c, 2).kind).toBe("accent");
    expect(tickAt(c, 1).kind).toBe("beat");
  });

  it("modo solo 2 y 4: silencia 1 y 3", () => {
    const c = cfg({ only24: true });
    expect(tickAt(c, 0).kind).toBe("silent");
    expect(tickAt(c, 1).kind).toBe("beat");
    expect(tickAt(c, 2).kind).toBe("silent");
    expect(tickAt(c, 3).kind).toBe("beat");
  });

  it("solo 2 y 4 con subdivisiones silencia las subs", () => {
    const c = cfg({ only24: true, subdivision: 2 });
    expect(tickAt(c, 2).kind).toBe("beat"); // cabeza del pulso 2
    expect(tickAt(c, 3).kind).toBe("silent");
  });

  it("compás de 7/8 tiene 7 ticks por compás con subdivisión 1", () => {
    const c = cfg({ signature: { beats: 7, unit: 8 } });
    expect(ticksPerMeasure(c)).toBe(7);
    expect(tickAt(c, 7).measure).toBe(1);
  });
});

describe("bpmAfterMeasures (auto-incremento)", () => {
  const auto = cfg({
    bpm: 100,
    autoIncrement: { enabled: true, addBpm: 5, everyMeasures: 4, maxBpm: 112 },
  });

  it("no sube antes de completar el bloque de compases", () => {
    expect(bpmAfterMeasures(auto, 3)).toBe(100);
  });

  it("sube por escalones", () => {
    expect(bpmAfterMeasures(auto, 4)).toBe(105);
    expect(bpmAfterMeasures(auto, 8)).toBe(110);
  });

  it("respeta el tope maxBpm", () => {
    expect(bpmAfterMeasures(auto, 40)).toBe(112);
  });

  it("desactivado devuelve el bpm base", () => {
    expect(bpmAfterMeasures(cfg({ bpm: 90 }), 100)).toBe(90);
  });
});

describe("bpmFromTaps", () => {
  it("necesita al menos dos taps", () => {
    expect(bpmFromTaps([1000])).toBeNull();
  });

  it("calcula el bpm medio de los intervalos", () => {
    // 500ms entre taps = 120 bpm
    expect(bpmFromTaps([0, 500, 1000, 1500])).toBe(120);
  });

  it("ignora pausas largas entre tandas de taps", () => {
    expect(bpmFromTaps([0, 10000, 10500, 11000])).toBe(120);
  });

  it("clampa a los límites", () => {
    expect(bpmFromTaps([0, 100])).toBe(300);
    expect(clampBpm(1000)).toBe(300);
    expect(clampBpm(1)).toBe(20);
  });
});
