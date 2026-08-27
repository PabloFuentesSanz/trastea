import { describe, expect, it } from "vitest";
import { heatLevel, heatmapGrid, type DayMinutes } from "./heatmap";

// 2026-08-27 es jueves
const HOY = "2026-08-27";

function dias(...entries: [string, number][]): DayMinutes[] {
  return entries.map(([date, minutes]) => ({ date, minutes }));
}

describe("heatLevel", () => {
  it("cero minutos es cero, no el nivel más bajo", () => {
    expect(heatLevel(0)).toBe(0);
  });

  it("sube de nivel por tramos de práctica reconocibles", () => {
    expect(heatLevel(5)).toBe(1);
    expect(heatLevel(20)).toBe(2);
    expect(heatLevel(45)).toBe(3);
    expect(heatLevel(90)).toBe(4);
  });

  it("no se pasa del nivel máximo por mucho que practiques", () => {
    expect(heatLevel(600)).toBe(4);
  });
});

describe("heatmapGrid", () => {
  it("dibuja las semanas pedidas, todas de siete días", () => {
    const grid = heatmapGrid([], { today: HOY, weeks: 12 });
    expect(grid.weeks).toHaveLength(12);
    for (const w of grid.weeks) expect(w).toHaveLength(7);
  });

  it("la última casilla es hoy", () => {
    const grid = heatmapGrid([], { today: HOY, weeks: 4 });
    const ultima = grid.weeks[grid.weeks.length - 1];
    const conFecha = ultima.filter((c) => c.inRange);
    expect(conFecha[conFecha.length - 1].date).toBe(HOY);
  });

  it("los días posteriores a hoy quedan fuera de rango, no a cero", () => {
    const grid = heatmapGrid([], { today: HOY, weeks: 4 });
    const ultima = grid.weeks[grid.weeks.length - 1];
    // jueves = índice 3: viernes, sábado y domingo aún no han pasado
    expect(ultima.slice(4).every((c) => !c.inRange)).toBe(true);
    expect(ultima.slice(0, 4).every((c) => c.inRange)).toBe(true);
  });

  it("cada semana empieza en lunes", () => {
    const grid = heatmapGrid([], { today: HOY, weeks: 6 });
    for (const w of grid.weeks) {
      const primera = w.find((c) => c.date);
      if (primera) expect(new Date(`${w[0].date}T00:00:00Z`).getUTCDay()).toBe(1);
    }
  });

  it("suma varias sesiones del mismo día", () => {
    const grid = heatmapGrid(dias([HOY, 20], [HOY, 25]), { today: HOY, weeks: 2 });
    const hoy = grid.weeks.flat().find((c) => c.date === HOY);
    expect(hoy?.minutes).toBe(45);
    expect(hoy?.level).toBe(3);
  });

  it("ignora lo que cae fuera de la ventana", () => {
    const grid = heatmapGrid(dias(["2020-01-01", 300], [HOY, 30]), {
      today: HOY,
      weeks: 4,
    });
    expect(grid.total).toBe(30);
  });

  it("cuenta el total y los días practicados", () => {
    const grid = heatmapGrid(dias([HOY, 30], ["2026-08-26", 15], ["2026-08-24", 0]), {
      today: HOY,
      weeks: 4,
    });
    expect(grid.total).toBe(45);
    expect(grid.practicedDays).toBe(2);
  });

  it("la racha cuenta hacia atrás desde hoy", () => {
    const grid = heatmapGrid(dias(["2026-08-25", 20], ["2026-08-26", 20], [HOY, 20]), {
      today: HOY,
      weeks: 4,
    });
    expect(grid.streak).toBe(3);
  });

  it("no da la racha por rota si hoy todavía no has tocado", () => {
    const grid = heatmapGrid(dias(["2026-08-25", 20], ["2026-08-26", 20]), {
      today: HOY,
      weeks: 4,
    });
    expect(grid.streak).toBe(2);
  });

  it("pero se rompe si llevas dos días sin tocar", () => {
    const grid = heatmapGrid(dias(["2026-08-24", 20], ["2026-08-25", 20]), {
      today: HOY,
      weeks: 4,
    });
    expect(grid.streak).toBe(0);
  });

  it("guarda la mejor racha del periodo aunque ya se haya roto", () => {
    const grid = heatmapGrid(
      dias(
        ["2026-08-10", 20],
        ["2026-08-11", 20],
        ["2026-08-12", 20],
        ["2026-08-13", 20],
        ["2026-08-26", 20],
      ),
      { today: HOY, weeks: 8 },
    );
    expect(grid.bestStreak).toBe(4);
  });

  it("etiqueta los meses una sola vez, en la columna donde empiezan", () => {
    const grid = heatmapGrid([], { today: HOY, weeks: 12 });
    const etiquetas = grid.months.map((m) => m.label);
    expect(new Set(etiquetas).size).toBe(etiquetas.length);
    expect(etiquetas).toContain("ago");
    for (const m of grid.months) {
      expect(m.column).toBeGreaterThanOrEqual(0);
      expect(m.column).toBeLessThan(grid.weeks.length);
    }
  });
});
