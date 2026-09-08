import { describe, expect, it } from "vitest";
import { desvioMs, resumenDeRitmo } from "./timing";

describe("desvioMs", () => {
  it("mide contra el pulso más cercano, no contra el último que sonó", () => {
    // último tick en 10 s, a 60 bpm: el pulso siguiente cae en 11 s
    expect(desvioMs(10.02, 10, 1)).toBe(20);
    expect(desvioMs(10.96, 10, 1)).toBe(-40);
    expect(desvioMs(12.4, 10, 1)).toBe(400);
  });
});

describe("resumenDeRitmo", () => {
  it("con todo dentro de la ventana es clavado", () => {
    const r = resumenDeRitmo([5, -10, 12, 0, -3, 8]);
    expect(r.dentro).toBe(1);
    expect(r.etiqueta).toBe("Clavado");
  });

  it("detecta si vas siempre por delante o por detrás", () => {
    const delante = resumenDeRitmo([-60, -55, -70, -65]);
    expect(delante.medioMs).toBeLessThan(-30);
    expect(delante.consejo).toMatch(/delante|adelant/i);
    const detras = resumenDeRitmo([60, 55, 70, 65]);
    expect(detras.consejo).toMatch(/detrás|tarde/i);
  });

  it("sin golpes no hay resumen que valga", () => {
    const r = resumenDeRitmo([]);
    expect(r.dentro).toBe(0);
    expect(r.golpes).toBe(0);
  });
});
