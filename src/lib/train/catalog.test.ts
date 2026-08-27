import { describe, expect, it } from "vitest";
import { DRILLS, drillsForSkills, getDrill, drillLevel, filterDrills } from "./catalog";
import { cardId, parseCardId } from "./cards";
import { isTrainLevel, isTrainSkill, isTrainTheme, isTrainMode } from "./taxonomy";

describe("catálogo de entrenamientos", () => {
  it("no hay dos entrenamientos con el mismo slug", () => {
    const slugs = DRILLS.map((d) => d.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("todos declaran valores del vocabulario cerrado", () => {
    for (const drill of DRILLS) {
      expect(isTrainTheme(drill.theme), drill.slug).toBe(true);
      expect(isTrainMode(drill.mode), drill.slug).toBe(true);
      expect(drill.skills.length, drill.slug).toBeGreaterThan(0);
      for (const skill of drill.skills) {
        expect(isTrainSkill(skill), `${drill.slug}: ${skill}`).toBe(true);
      }
    }
  });

  it("los niveles van en orden y sin repetirse", () => {
    for (const drill of DRILLS) {
      const niveles = drill.levels.map((l) => l.level);
      expect(new Set(niveles).size, drill.slug).toBe(niveles.length);
      expect(
        [...niveles].sort((a, b) => a - b),
        drill.slug,
      ).toEqual(niveles);
      for (const n of niveles) expect(isTrainLevel(n), drill.slug).toBe(true);
    }
  });

  it("cada nivel genera un mazo con tarjetas de verdad", () => {
    for (const drill of DRILLS) {
      for (const level of drill.levels) {
        const mazo = level.build();
        const donde = `${drill.slug} n${level.level}`;
        expect(mazo.length, donde).toBeGreaterThan(0);
        // un mazo gigante no se estudia: se abandona
        expect(mazo.length, donde).toBeLessThanOrEqual(300);
      }
    }
  });

  it("ninguna tarjeta se repite dentro de su mazo", () => {
    for (const drill of DRILLS) {
      for (const level of drill.levels) {
        const ids = level.build().map(cardId);
        expect(new Set(ids).size, `${drill.slug} n${level.level}`).toBe(ids.length);
      }
    }
  });

  it("toda tarjeta generada se puede reconstruir desde su id", () => {
    for (const drill of DRILLS) {
      for (const level of drill.levels) {
        for (const card of level.build()) {
          expect(parseCardId(cardId(card)), cardId(card)).toEqual(card);
        }
      }
    }
  });

  it("un nivel nunca es más pequeño que el anterior", () => {
    for (const drill of DRILLS) {
      const tamaños = drill.levels.map((l) => l.build().length);
      for (let i = 1; i < tamaños.length; i += 1) {
        expect(
          tamaños[i],
          `${drill.slug} n${drill.levels[i].level}`,
        ).toBeGreaterThanOrEqual(tamaños[i - 1]);
      }
    }
  });

  it("cada entrenamiento genera el tipo de tarjeta que dice su modalidad", () => {
    for (const drill of DRILLS) {
      for (const card of drill.levels[0].build()) {
        if (drill.mode === "escuchar") {
          expect(card.type.startsWith("ear_"), drill.slug).toBe(true);
        } else {
          expect(card.type.startsWith("ear_"), drill.slug).toBe(false);
        }
      }
    }
  });
});

describe("getDrill y drillLevel", () => {
  it("encuentra por slug", () => {
    expect(getDrill("notas-del-mastil")?.slug).toBe("notas-del-mastil");
    expect(getDrill("no-existe")).toBeUndefined();
  });

  it("devuelve el nivel pedido, o el primero si no existe", () => {
    const drill = getDrill("notas-del-mastil")!;
    expect(drillLevel(drill, 3).level).toBe(3);
    expect(drillLevel(drill, 99 as never).level).toBe(drill.levels[0].level);
  });
});

describe("filterDrills", () => {
  it("sin filtros los devuelve todos", () => {
    expect(filterDrills(DRILLS, {})).toHaveLength(DRILLS.length);
  });

  it("filtra por tema", () => {
    const oido = filterDrills(DRILLS, { theme: "oido" });
    expect(oido.length).toBeGreaterThan(0);
    expect(oido.every((d) => d.theme === "oido")).toBe(true);
  });

  it("filtra por modalidad", () => {
    const escuchar = filterDrills(DRILLS, { mode: "escuchar" });
    expect(escuchar.every((d) => d.mode === "escuchar")).toBe(true);
  });

  it("filtra por destreza", () => {
    const found = filterDrills(DRILLS, { skill: "reconocer-intervalos" });
    expect(found.length).toBeGreaterThan(0);
    expect(found.every((d) => d.skills.includes("reconocer-intervalos"))).toBe(true);
  });

  it("filtra por nivel: sale lo que se puede hacer a ese nivel", () => {
    const nivel1 = filterDrills(DRILLS, { level: 1 });
    expect(nivel1.every((d) => d.levels.some((l) => l.level === 1))).toBe(true);
  });

  it("combina filtros", () => {
    const found = filterDrills(DRILLS, { theme: "intervalos", level: 1 });
    expect(
      found.every((d) => d.theme === "intervalos" && d.levels.some((l) => l.level === 1)),
    ).toBe(true);
  });

  it("una combinación imposible devuelve una lista vacía, no todo", () => {
    expect(filterDrills(DRILLS, { theme: "oido", skill: "pua-alterna" })).toEqual([]);
  });
});

describe("drillsForSkills", () => {
  it("sin destrezas no propone nada", () => {
    expect(drillsForSkills([])).toEqual([]);
  });

  it("propone lo que comparte destreza y nada más", () => {
    const found = drillsForSkills(["oido-relativo"]);
    expect(found.length).toBeGreaterThan(0);
    expect(found.every((d) => d.skills.includes("oido-relativo"))).toBe(true);
  });

  it("primero el que comparte más destrezas, no el que salga antes", () => {
    // "octavas" comparte las dos; "notas-del-mastil" solo una
    const found = drillsForSkills(["nombres-de-notas", "octavas"]);
    expect(found[0].slug).toBe("octavas");
  });

  it("el orden es estable: dos llamadas iguales dan lo mismo", () => {
    const a = drillsForSkills(["digitaciones"]).map((d) => d.slug);
    const b = drillsForSkills(["digitaciones"]).map((d) => d.slug);
    expect(a).toEqual(b);
  });

  it("una destreza que ningún entrenamiento cubre no inventa nada", () => {
    expect(drillsForSkills(["palm-mute"])).toEqual([]);
  });
});
