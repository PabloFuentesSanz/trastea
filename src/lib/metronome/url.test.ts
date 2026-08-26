import { describe, expect, it } from "vitest";
import { configFromParams, paramsFromConfig } from "./url";
import { DEFAULT_CONFIG } from "./pattern";

describe("configFromParams", () => {
  it("sin params devuelve la configuración por defecto", () => {
    expect(configFromParams({})).toEqual(DEFAULT_CONFIG);
  });

  it("parsea el ejemplo de una lección: bpm=80&sig=4/4&sub=2&accent=24", () => {
    const c = configFromParams({ bpm: "80", sig: "4/4", sub: "2", accent: "24" });
    expect(c.bpm).toBe(80);
    expect(c.subdivision).toBe(2);
    expect(c.accents).toEqual([1, 3]);
  });

  it("clampa bpm e ignora valores corruptos", () => {
    expect(configFromParams({ bpm: "9999" }).bpm).toBe(300);
    expect(configFromParams({ bpm: "abc" }).bpm).toBe(DEFAULT_CONFIG.bpm);
    expect(configFromParams({ sig: "banana" }).signature).toEqual(
      DEFAULT_CONFIG.signature,
    );
    expect(configFromParams({ sub: "7" }).subdivision).toBe(1);
  });

  it("activa auto-incremento con inc/every/max", () => {
    const c = configFromParams({ inc: "5", every: "8", max: "160" });
    expect(c.autoIncrement).toEqual({
      enabled: true,
      addBpm: 5,
      everyMeasures: 8,
      maxBpm: 160,
    });
  });

  it("descarta acentos fuera del compás", () => {
    const c = configFromParams({ sig: "3/4", accent: "14" });
    expect(c.accents).toEqual([0]);
  });
});

describe("paramsFromConfig (ida y vuelta)", () => {
  it("solo serializa lo que difiere del defecto (más bpm)", () => {
    expect(paramsFromConfig(DEFAULT_CONFIG).toString()).toBe("bpm=80");
  });

  it("round-trip conserva la configuración", () => {
    const c = configFromParams({
      bpm: "132",
      sig: "7/8",
      sub: "3",
      accent: "135",
      only24: "1",
      inc: "2",
      every: "4",
      max: "150",
    });
    const roundTripped = configFromParams(
      Object.fromEntries(paramsFromConfig(c).entries()),
    );
    expect(roundTripped).toEqual(c);
  });
});
