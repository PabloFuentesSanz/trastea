import { describe, expect, it } from "vitest";
import { parseTab } from "@/lib/music/tab";
import { beamGroups, beatTicks, columnWidthFactor, layoutColumns } from "./tab-layout";

describe("columnWidthFactor", () => {
  it("la corchea es la unidad: las tabs de siempre no se mueven", () => {
    expect(columnWidthFactor(0.5)).toBe(1);
  });

  it("una figura más larga ocupa más y una más corta menos", () => {
    expect(columnWidthFactor(1)).toBeGreaterThan(columnWidthFactor(0.5));
    expect(columnWidthFactor(0.25)).toBeLessThan(columnWidthFactor(0.5));
  });

  it("crece despacio: una redonda no ocupa ocho corcheas", () => {
    expect(columnWidthFactor(4)).toBeLessThan(columnWidthFactor(0.5) * 3);
  });

  it("nunca baja de lo que mide un traste de dos cifras", () => {
    expect(columnWidthFactor(0.125)).toBeGreaterThanOrEqual(0.8);
  });
});

describe("layoutColumns", () => {
  it("coloca cada columna después de la anterior", () => {
    const { placed } = layoutColumns(parseTab("6:5 6:7 6:8"), 26, 34, 10, 14);
    expect(placed[1].x).toBeGreaterThan(placed[0].x);
    expect(placed[2].x).toBeGreaterThan(placed[1].x);
  });

  it("deja aire entre compases y marca dónde va la barra", () => {
    const { placed } = layoutColumns(parseTab("6:5 | 6:7"), 26, 34, 10, 14);
    expect(placed[1].barLineBefore).toBe(true);
    expect(placed[0].barLineBefore).toBe(false);
  });

  it("una columna con acorde es más ancha que una de una nota", () => {
    const { placed } = layoutColumns(parseTab("6:5 6:3+5:2"), 26, 34, 10, 14);
    expect(placed[1].width).toBeGreaterThan(placed[0].width);
  });

  it("las semicorcheas se dibujan más juntas que las corcheas", () => {
    const { placed } = layoutColumns(parseTab("6:5 [16] 6:7"), 26, 34, 10, 14);
    expect(placed[1].width).toBeLessThan(placed[0].width);
  });

  it("cada columna sabe en qué pulso entra y cuánto dura", () => {
    const { placed } = layoutColumns(parseTab("6:5 6:7 | [16] 6:8 6:9"), 26, 34, 10, 14);
    expect(placed.map((p) => p.start)).toEqual([0, 0.5, 1, 1.25]);
    expect(placed.map((p) => p.column.beats)).toEqual([0.5, 0.5, 0.25, 0.25]);
  });
});

describe("beatTicks", () => {
  it("una marca por pulso, en el sitio donde cae", () => {
    const { placed } = layoutColumns(parseTab("6:5 6:7 6:8 6:9"), 26, 34, 10, 14);
    const ticks = beatTicks(placed);
    expect(ticks.map((t) => t.beat)).toEqual([0, 1]);
    expect(ticks[0].x).toBeLessThan(ticks[1].x);
  });

  it("con figuras mezcladas los pulsos siguen cayendo donde toca", () => {
    // dos corcheas (1 pulso) y luego cuatro semicorcheas (1 pulso)
    const { placed } = layoutColumns(
      parseTab("6:5 6:7 [16] 6:8 6:9 6:10 6:11"),
      26,
      34,
      10,
      14,
    );
    const ticks = beatTicks(placed);
    expect(ticks.map((t) => t.beat)).toEqual([0, 1]);
    // el segundo pulso empieza justo donde arranca la primera semicorchea
    expect(ticks[1].x).toBeCloseTo(placed[2].x - placed[2].width / 2, 6);
  });

  it("no inventa un pulso donde ninguna columna empieza", () => {
    // una blanca: ocupa dos pulsos pero solo hay marca en el que empieza
    const { placed } = layoutColumns(parseTab("[2] 6:5"), 26, 34, 10, 14);
    expect(beatTicks(placed).map((t) => t.beat)).toEqual([0]);
  });
});

describe("beamGroups", () => {
  it("une las columnas seguidas de la misma figura dentro del pulso", () => {
    const { placed } = layoutColumns(parseTab("6:5 6:7 6:8 6:9"), 26, 34, 10, 14);
    const grupos = beamGroups(placed);
    // dos pulsos de corcheas: dos grupos de dos, con una barra cada uno
    expect(grupos.map((g) => g.beams)).toEqual([1, 1]);
    expect(grupos).toHaveLength(2);
  });

  it("no cruza el pulso: cada grupo se cierra donde acaba su pulso", () => {
    const { placed } = layoutColumns(
      parseTab("[16] 6:5 6:7 6:8 6:9 6:10 6:11 6:12 6:13"),
      26,
      34,
      10,
      14,
    );
    expect(beamGroups(placed)).toHaveLength(2);
  });

  it("una figura de negra o más larga no lleva barras", () => {
    const { placed } = layoutColumns(parseTab("[4] 6:5 6:7"), 26, 34, 10, 14);
    expect(beamGroups(placed)).toEqual([]);
  });

  it("al cambiar de figura empieza un grupo nuevo", () => {
    const { placed } = layoutColumns(
      parseTab("6:5 6:7 [16] 6:8 6:9 6:10 6:11"),
      26,
      34,
      10,
      14,
    );
    const grupos = beamGroups(placed);
    expect(grupos.map((g) => g.beams)).toEqual([1, 2]);
  });

  it("el tresillo se marca como tal, para no leerlo como dos corcheas y pico", () => {
    const { placed } = layoutColumns(parseTab("[8t] 6:5 6:7 6:8"), 26, 34, 10, 14);
    const [grupo] = beamGroups(placed);
    expect(grupo.triplet).toBe(true);
    expect(grupo.beams).toBe(1);
  });

  it("el grupo va de la primera a la última columna que abarca", () => {
    const { placed } = layoutColumns(parseTab("6:5 6:7"), 26, 34, 10, 14);
    const [grupo] = beamGroups(placed);
    expect(grupo.from).toBeCloseTo(placed[0].x, 6);
    expect(grupo.to).toBeCloseTo(placed[1].x, 6);
  });
});
