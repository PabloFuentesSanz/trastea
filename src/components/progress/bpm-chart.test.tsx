import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BpmChart, type BpmPoint } from "./bpm-chart";

const TITLES = { "cromatico-1234": "Cromático 1-2-3-4" };

function records(...bpms: number[]): BpmPoint[] {
  return bpms.map((bpm, i) => ({
    exercise_slug: "cromatico-1234",
    bpm,
    recorded_at: `2026-03-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
  }));
}

describe("BpmChart", () => {
  it("sin registros explica cómo aparecen, sin dibujar un gráfico vacío", () => {
    render(<BpmChart records={[]} titles={TITLES} />);
    expect(screen.getByText(/Todavía no hay registros/)).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("el gráfico se anuncia con el resumen de la evolución", () => {
    render(<BpmChart records={records(60, 72, 84)} titles={TITLES} />);
    expect(
      screen.getByRole("img", {
        name: "Cromático 1-2-3-4: de 60 a 84 bpm en 3 registros.",
      }),
    ).toBeInTheDocument();
  });

  it("los datos están también en una tabla, para quien no ve el dibujo", () => {
    render(<BpmChart records={records(60, 72)} titles={TITLES} />);
    const filas = screen.getAllByRole("row");
    // cabecera + dos registros
    expect(filas).toHaveLength(3);
    expect(screen.getByRole("cell", { name: "60" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "72" })).toBeInTheDocument();
  });

  it("cada punto es alcanzable con el teclado y dice su fecha y su bpm", () => {
    render(<BpmChart records={records(60, 72)} titles={TITLES} />);
    const puntos = screen.getAllByRole("button");
    expect(puntos).toHaveLength(2);
    expect(puntos[1]).toHaveAccessibleName("02/03: 72 bpm");
  });

  it("ordena por fecha aunque lleguen desordenados", () => {
    const desordenados: BpmPoint[] = [
      { exercise_slug: "cromatico-1234", bpm: 90, recorded_at: "2026-03-09T10:00:00Z" },
      { exercise_slug: "cromatico-1234", bpm: 60, recorded_at: "2026-03-01T10:00:00Z" },
    ];
    render(<BpmChart records={desordenados} titles={TITLES} />);
    expect(screen.getByRole("img", { name: /de 60 a 90 bpm/ })).toBeInTheDocument();
  });

  it("un solo registro no se cuenta como evolución", () => {
    render(<BpmChart records={records(80)} titles={TITLES} />);
    expect(
      screen.getByRole("img", { name: /un solo registro, 80 bpm/ }),
    ).toBeInTheDocument();
  });
});
