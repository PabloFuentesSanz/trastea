import { describe, expect, it } from "vitest";
import { lineChartLayout, niceTicks, type ChartPoint } from "./line";

const BOX = {
  width: 400,
  height: 200,
  padding: { top: 8, right: 8, bottom: 24, left: 36 },
};

function pts(...values: number[]): ChartPoint[] {
  return values.map((value, i) => ({ label: `p${i}`, value }));
}

describe("niceTicks", () => {
  it("usa pasos redondos, no los extremos crudos", () => {
    expect(niceTicks(62, 138, 5)).toEqual([60, 80, 100, 120, 140]);
  });

  it("no se sale del dominio pedido hacia dentro", () => {
    const ticks = niceTicks(100, 104, 4);
    expect(ticks[0]).toBeLessThanOrEqual(100);
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(104);
  });

  it("sobrevive a un dominio plano", () => {
    expect(niceTicks(90, 90, 4).length).toBeGreaterThan(0);
  });
});

describe("lineChartLayout", () => {
  it("sin puntos no dibuja camino", () => {
    const layout = lineChartLayout([], BOX);
    expect(layout.points).toEqual([]);
    expect(layout.path).toBe("");
  });

  it("con un punto lo centra y no inventa una línea", () => {
    const layout = lineChartLayout(pts(80), BOX);
    expect(layout.points).toHaveLength(1);
    expect(layout.points[0].x).toBeCloseTo(
      BOX.padding.left + (BOX.width - BOX.padding.left - BOX.padding.right) / 2,
    );
    expect(layout.path).toBe("");
  });

  it("reparte los puntos de izquierda a derecha dentro del área de dibujo", () => {
    const layout = lineChartLayout(pts(60, 80, 100), BOX);
    const xs = layout.points.map((p) => p.x);
    expect(xs[0]).toBeCloseTo(BOX.padding.left);
    expect(xs[2]).toBeCloseTo(BOX.width - BOX.padding.right);
    expect(xs[1]).toBeGreaterThan(xs[0]);
    expect(xs[2]).toBeGreaterThan(xs[1]);
  });

  it("invierte el eje Y: más bpm, más arriba", () => {
    const layout = lineChartLayout(pts(60, 120), BOX);
    expect(layout.points[1].y).toBeLessThan(layout.points[0].y);
  });

  it("mantiene todo dentro de la caja, márgenes incluidos", () => {
    const layout = lineChartLayout(pts(60, 61, 200, 90), BOX);
    for (const p of layout.points) {
      expect(p.x).toBeGreaterThanOrEqual(BOX.padding.left - 0.01);
      expect(p.x).toBeLessThanOrEqual(BOX.width - BOX.padding.right + 0.01);
      expect(p.y).toBeGreaterThanOrEqual(BOX.padding.top - 0.01);
      expect(p.y).toBeLessThanOrEqual(BOX.height - BOX.padding.bottom + 0.01);
    }
  });

  it("con todos los valores iguales dibuja una recta, no una división por cero", () => {
    const layout = lineChartLayout(pts(90, 90, 90), BOX);
    const ys = layout.points.map((p) => p.y);
    expect(ys.every((y) => Number.isFinite(y))).toBe(true);
    expect(new Set(ys).size).toBe(1);
  });

  it("el camino une todos los puntos en orden", () => {
    const layout = lineChartLayout(pts(60, 80, 100), BOX);
    expect(layout.path.startsWith("M")).toBe(true);
    expect(layout.path.match(/L/g)).toHaveLength(2);
  });

  it("conserva etiqueta y valor de cada punto", () => {
    const layout = lineChartLayout(pts(72, 96), BOX);
    expect(layout.points.map((p) => p.value)).toEqual([72, 96]);
    expect(layout.points.map((p) => p.label)).toEqual(["p0", "p1"]);
  });

  it("las marcas del eje caen dentro del área y en orden descendente de y", () => {
    const layout = lineChartLayout(pts(62, 138), BOX);
    expect(layout.ticks.length).toBeGreaterThan(1);
    for (const t of layout.ticks) {
      expect(t.y).toBeGreaterThanOrEqual(BOX.padding.top - 0.01);
      expect(t.y).toBeLessThanOrEqual(BOX.height - BOX.padding.bottom + 0.01);
    }
    const ys = layout.ticks.map((t) => t.y);
    expect([...ys].sort((a, b) => b - a)).toEqual(ys);
  });

  it("enseña como mucho unas pocas etiquetas de X aunque haya muchos puntos", () => {
    const layout = lineChartLayout(
      pts(...Array.from({ length: 40 }, (_, i) => 60 + i)),
      BOX,
    );
    const visibles = layout.points.filter((p) => p.showLabel);
    expect(visibles.length).toBeLessThanOrEqual(8);
    expect(visibles.length).toBeGreaterThan(1);
    // el primero y el último siempre se ven: son las fechas que orientan
    expect(layout.points[0].showLabel).toBe(true);
    expect(layout.points[layout.points.length - 1].showLabel).toBe(true);
  });
});
