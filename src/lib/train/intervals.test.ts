import { describe, expect, it } from "vitest";
import {
  INTERVAL_CHOICES,
  intervalLabel,
  intervalMnemonic,
  intervalShort,
} from "./intervals";

describe("intervalLabel", () => {
  it("nombra los doce de la octava", () => {
    expect(intervalLabel(0)).toBe("Unísono");
    expect(intervalLabel(1)).toBe("2ª menor");
    expect(intervalLabel(4)).toBe("3ª mayor");
    expect(intervalLabel(6)).toBe("Tritono");
    expect(intervalLabel(7)).toBe("5ª justa");
    expect(intervalLabel(11)).toBe("7ª mayor");
    expect(intervalLabel(12)).toBe("Octava");
  });

  it("sigue nombrando por encima de la octava", () => {
    expect(intervalLabel(14)).toBe("9ª mayor");
    expect(intervalLabel(24)).toBe("Doble octava");
  });

  it("los descendentes se nombran igual, marcando que bajan", () => {
    expect(intervalLabel(-7)).toBe("5ª justa descendente");
  });
});

describe("intervalShort", () => {
  it("cabe en un botón", () => {
    expect(intervalShort(4)).toBe("3M");
    expect(intervalShort(3)).toBe("3m");
    expect(intervalShort(7)).toBe("5J");
    expect(intervalShort(6)).toBe("TT");
    expect(intervalShort(12)).toBe("8ª");
  });

  it("no hay dos iguales dentro de la octava", () => {
    const cortos = Array.from({ length: 13 }, (_, i) => intervalShort(i));
    expect(new Set(cortos).size).toBe(cortos.length);
  });
});

describe("intervalMnemonic", () => {
  it("da una canción para los que se confunden de oído", () => {
    expect(intervalMnemonic(6)).toContain("Simpson");
    expect(intervalMnemonic(3)).toContain("Smoke");
  });

  it("hay una para cada intervalo de la octava", () => {
    for (let s = 0; s <= 12; s += 1) {
      expect(intervalMnemonic(s), `semitono ${s}`).toBeTruthy();
    }
  });

  it("no inventa nada para los compuestos", () => {
    expect(intervalMnemonic(19)).toBeUndefined();
  });
});

describe("INTERVAL_CHOICES", () => {
  it("ofrece los trece de la octava, en orden", () => {
    expect(INTERVAL_CHOICES.map((c) => c.semitones)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
  });

  it("cada opción trae su etiqueta larga y su corta", () => {
    for (const c of INTERVAL_CHOICES) {
      expect(c.label).toBe(intervalLabel(c.semitones));
      expect(c.short).toBe(intervalShort(c.semitones));
    }
  });
});
