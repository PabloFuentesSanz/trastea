import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * getByTitle sólo mira los `<title>` que cuelgan directamente del `<svg>`, y
 * los nuestros van dentro de cada `<rect>` —que es donde el navegador enseña
 * el tooltip—, así que se buscan a mano.
 */
function tooltips(container: HTMLElement): string[] {
  return [...container.querySelectorAll("rect > title")].map((t) => t.textContent ?? "");
}
import { PracticeHeatmap } from "./practice-heatmap";

const HOY = "2026-08-27";

describe("PracticeHeatmap", () => {
  it("sin sesiones invita a empezar en vez de enseñar un cero", () => {
    render(<PracticeHeatmap sessions={[]} today={HOY} weeks={4} />);
    expect(screen.getByText(/Aquí se irá pintando tu calendario/)).toBeInTheDocument();
  });

  it("resume el tiempo en horas y minutos", () => {
    render(
      <PracticeHeatmap
        sessions={[
          { date: HOY, minutes: 45 },
          { date: "2026-08-26", minutes: 50 },
        ]}
        today={HOY}
        weeks={4}
      />,
    );
    expect(screen.getByText("1 h 35 min")).toBeInTheDocument();
    expect(screen.getByText(/en 2 días/)).toBeInTheDocument();
  });

  it("canta la racha cuando la hay", () => {
    render(
      <PracticeHeatmap
        sessions={[
          { date: HOY, minutes: 20 },
          { date: "2026-08-26", minutes: 20 },
        ]}
        today={HOY}
        weeks={4}
      />,
    );
    expect(screen.getByText("2 días")).toBeInTheDocument();
  });

  it("cada casilla dice su fecha y sus minutos al pasar por encima", () => {
    const { container } = render(
      <PracticeHeatmap sessions={[{ date: HOY, minutes: 30 }]} today={HOY} weeks={2} />,
    );
    expect(tooltips(container)).toContain("2026-08-27: 30 min");
    expect(tooltips(container)).toContain("2026-08-26: sin práctica");
  });

  it("no pinta los días que aún no han llegado", () => {
    const { container } = render(<PracticeHeatmap sessions={[]} today={HOY} weeks={2} />);
    const fechas = tooltips(container);
    // 27/08 es jueves: viernes 28 todavía no existe en el calendario
    expect(fechas.some((t) => t.startsWith("2026-08-28"))).toBe(false);
    expect(fechas.some((t) => t.startsWith("2026-08-27"))).toBe(true);
  });

  it("el calendario se anuncia con su resumen", () => {
    render(
      <PracticeHeatmap sessions={[{ date: HOY, minutes: 30 }]} today={HOY} weeks={26} />,
    );
    expect(
      screen.getByRole("img", {
        name: "Calendario de práctica de las últimas 26 semanas: 30 min en 1 días.",
      }),
    ).toBeInTheDocument();
  });
});
