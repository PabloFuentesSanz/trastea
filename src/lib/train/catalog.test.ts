import { describe, expect, it } from "vitest";
import { DRILLS, drillsForSkills, getDrill, drillLevel, filterDrills } from "./catalog";
import { cardId, parseCardId, type TrainCard } from "./cards";
import { selectSession } from "@/lib/srs/scheduler";
import { intervalBetweenPositions } from "./cards";
import { scaleBoxPositions } from "./scales";
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

  /**
   * Antes esto exigía que un nivel no fuera más pequeño que el anterior, y esa
   * idea es justo la que rompió "reconocer intervalos": para crecer, el nivel
   * 5 arrastraba entero el 3, sus tarjetas ya estudiadas llenaban la sesión y
   * el nivel avanzado preguntaba lo de principiante. Lo que importa no es el
   * tamaño, es que traiga material que no estaba.
   */
  it("cada nivel trae material que no estaba en el anterior", () => {
    for (const drill of DRILLS) {
      for (let i = 1; i < drill.levels.length; i += 1) {
        const previo = new Set(drill.levels[i - 1].build().map(cardId));
        const actual = drill.levels[i].build().map(cardId);
        const nuevas = actual.filter((id) => !previo.has(id));
        expect(
          nuevas.length / actual.length,
          `${drill.slug} n${drill.levels[i].level}`,
        ).toBeGreaterThan(0.1);
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

/** Las cuerdas que toca una tarjeta, si es de mástil. */
function cuerdasDe(card: TrainCard): number[] {
  switch (card.type) {
    case "fretboard_note":
      return [card.string];
    case "interval_name":
      return [card.from.string, card.to.string];
    case "interval_build":
      return [card.from.string];
    case "scale_degree":
      return [card.position.string];
    case "scale_box":
      return scaleBoxPositions(card.root, card.scaleId, card.box).map((p) => p.string);
    default:
      return [];
  }
}

describe("la sesión recorre el mazo, no su primera esquina", () => {
  /** Azar determinista: el test no puede depender de la suerte. */
  function secuencia(semilla: number) {
    let x = semilla;
    return () => {
      x = (x * 9301 + 49297) % 233280;
      return x / 233280;
    };
  }

  const SESSION_SIZE = 20;

  it("un nivel que usa las seis cuerdas las pregunta de verdad", () => {
    // Esto es lo que se veía usándolo: en avanzado seguían saliendo las mismas
    // preguntas en la 6ª cuerda que en principiante. El mazo sí tenía las seis;
    // la sesión cogía siempre las primeras veinte cartas, todas de la cuerda 0.
    for (const drill of DRILLS) {
      for (const level of drill.levels) {
        const mazo = level.build();
        const cuerdasDelMazo = new Set(mazo.flatMap(cuerdasDe));
        // solo interesa cuando el mazo de verdad abarca varias cuerdas y hay
        // mucho más de lo que cabe en una sesión
        if (cuerdasDelMazo.size < 4 || mazo.length < SESSION_SIZE * 2) continue;

        const ahora = Date.now();
        const sesion = selectSession(
          mazo.map((card) => ({ card, dueAt: ahora, reps: 0 })),
          ahora,
          SESSION_SIZE,
          secuencia(7),
        );
        const cuerdasDeLaSesion = new Set(sesion.flatMap(cuerdasDe));
        expect(
          cuerdasDeLaSesion.size,
          `${drill.slug} n${level.level}: el mazo abarca ${cuerdasDelMazo.size} cuerdas y la sesión solo ${cuerdasDeLaSesion.size}`,
        ).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it("dos sesiones seguidas no son la misma ronda de preguntas", () => {
    const mazo = getDrill("reconocer-intervalos")!.levels[3].build();
    const ahora = Date.now();
    const pedir = (semilla: number) =>
      selectSession(
        mazo.map((card) => ({ card, dueAt: ahora, reps: 0 })),
        ahora,
        SESSION_SIZE,
        secuencia(semilla),
      ).map(cardId);
    expect(pedir(1)).not.toEqual(pedir(2));
  });
});

describe("los intervalos cruzando cuerdas", () => {
  const cruzando = (nivel: number) =>
    getDrill("reconocer-intervalos")!
      .levels.find((l) => l.level === nivel)!
      .build()
      .filter((c) => c.type === "interval_name" && c.from.string !== c.to.string);

  it("incluyen las terceras, que son LA forma de la guitarra", () => {
    // Faltaban: se calculaba el traste destino como `intervalo - salto entre
    // cuerdas` y se descartaba si salía negativo, así que cruzando solo se
    // podían pedir intervalos más grandes que la distancia entre cuerdas.
    // Nunca una segunda ni una tercera, que es como se toca cualquier arpegio.
    const semitonos = new Set(
      cruzando(5).map((c) =>
        c.type === "interval_name" ? intervalBetweenPositions(c.from, c.to) : -1,
      ),
    );
    expect(semitonos, "tercera menor").toContain(3);
    expect(semitonos, "tercera mayor").toContain(4);
    expect(semitonos, "segunda mayor").toContain(2);
  });

  it("no se piden en trastes que no existen", () => {
    for (const nivel of [4, 5]) {
      for (const card of cruzando(nivel)) {
        if (card.type !== "interval_name") continue;
        expect(card.from.fret).toBeGreaterThanOrEqual(0);
        expect(card.to.fret).toBeGreaterThanOrEqual(0);
        expect(card.to.fret).toBeLessThanOrEqual(12);
      }
    }
  });

  it("el intervalo que se pide es el que hay de verdad entre las dos notas", () => {
    for (const card of cruzando(5)) {
      if (card.type !== "interval_name") continue;
      const real = intervalBetweenPositions(card.from, card.to);
      expect(real, `${cardId(card)}`).toBeGreaterThan(0);
      expect(real).toBeLessThanOrEqual(12);
    }
  });
});

describe("de qué trastes se parte", () => {
  const desdeQueTrastes = (slug: string, nivel: number) => {
    const mazo = getDrill(slug)!
      .levels.find((l) => l.level === nivel)!
      .build();
    return new Set(
      mazo.flatMap((c) => (c.type === "interval_build" ? [c.from.fret] : [])),
    );
  };

  it("no se pregunta siempre desde los mismos tres trastes", () => {
    // "Octavas por el mástil" y "Construir intervalos" partían SIEMPRE del
    // traste 0, 4 u 8, en todos sus niveles: el generador subía de cuatro en
    // cuatro y paraba en `maxFret - 4`. Un entrenamiento que se llama "por el
    // mástil" y nunca pasa del traste 8 no entrena el mástil.
    for (const slug of ["octavas", "construir-intervalos"]) {
      const trastes = desdeQueTrastes(slug, 3);
      expect(
        trastes.size,
        `${slug}: solo ${[...trastes].join(", ")}`,
      ).toBeGreaterThanOrEqual(4);
      // el traste 12 es la otra mitad del mástil: si no se llega ahí, no se
      // está entrenando el mástil entero
      expect(
        Math.max(...trastes),
        `${slug}: no pasa del traste 8`,
      ).toBeGreaterThanOrEqual(12);
    }
  });

  it("la nota que se pide existe en el mástil", () => {
    for (const drill of DRILLS) {
      for (const nivel of drill.levels) {
        for (const card of nivel.build()) {
          if (card.type !== "interval_build") continue;
          // desde donde se parte hasta donde se llega, todo tocable
          expect(card.from.fret).toBeLessThanOrEqual(17);
          expect(card.from.fret + card.semitones).toBeLessThanOrEqual(29);
        }
      }
    }
  });
});
