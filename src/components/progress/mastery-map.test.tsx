import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MasteryMap } from "./mastery-map";
import { mapaDelMastil } from "@/lib/progress/mastery";

const tarjeta = (id: string, intervalDays: number, lapses = 0) => ({
  cardId: id,
  dueAt: 0,
  reps: 4,
  ease: 2.5,
  intervalDays,
  lapses,
});

describe("<MasteryMap />", () => {
  it("sin nada estudiado, invita a entrenar en vez de dibujar un mástil vacío", () => {
    render(<MasteryMap mapa={[]} />);
    expect(screen.getByRole("link", { name: /notas del mástil/i })).toBeTruthy();
  });

  it("pinta una marca por nota, con el color de su nivel", () => {
    const mapa = mapaDelMastil([
      tarjeta("fretboard_note:0:5", 40),
      tarjeta("fretboard_note:0:7", 40),
      tarjeta("fretboard_note:1:3", 5),
      tarjeta("fretboard_note:2:2", 0.2),
      tarjeta("fretboard_note:3:9", 30, 2),
    ]);
    const { container } = render(<MasteryMap mapa={mapa} />);

    const color = (nombre: string) =>
      container.querySelectorAll(`circle[fill="var(--${nombre})"]`).length;
    expect(color("success")).toBe(2);
    expect(color("primary")).toBe(1);
    // la que vuelve dentro del día y la que se ha caído dos veces
    expect(color("destructive")).toBe(2);
  });

  it("cuenta lo que hay, para poder leerlo sin mirar el dibujo", () => {
    const mapa = mapaDelMastil([
      tarjeta("fretboard_note:0:5", 40),
      tarjeta("fretboard_note:1:3", 5),
    ]);
    render(<MasteryMap mapa={mapa} />);
    expect(
      screen.getByText(/1 nota te sale sola, 1 en marcha y 0 que se te caen/),
    ).toBeTruthy();
  });
});
