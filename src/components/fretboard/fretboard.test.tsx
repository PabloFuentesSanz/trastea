import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Fretboard } from "./fretboard";
import { formulaPositions } from "@/lib/music/fretboard";
import { windowPositions } from "@/lib/music/spec";
import { getTuning } from "@/data/tunings";

const PENTATONIC_A = formulaPositions({
  root: "A",
  intervals: ["1", "b3", "4", "5", "b7"],
  tuningMidi: getTuning("standard").midi,
  frets: 15,
});

function fretNumbers(container: HTMLElement): string[] {
  // los números de traste son los <text> sin peso: las etiquetas de nota van en negrita
  return [...container.querySelectorAll("text")]
    .filter((t) => t.getAttribute("font-weight") === null)
    .map((t) => t.textContent ?? "");
}

describe("<Fretboard /> con ventana", () => {
  it("numera cada traste real de la ventana, no los de la ventana", () => {
    const { container } = render(
      <Fretboard
        positions={windowPositions(PENTATONIC_A, { fromFret: 5, toFret: 8 })}
        fromFret={5}
        frets={8}
        title="Caja 1"
      />,
    );
    expect(fretNumbers(container)).toEqual(["5", "6", "7", "8"]);
  });

  it("no dibuja cejuela si la ventana empieza lejos del aire", () => {
    const { container } = render(
      <Fretboard positions={[]} fromFret={5} frets={8} title="Caja 1" />,
    );
    expect(container.querySelectorAll("rect")).toHaveLength(0);
  });

  it("dibuja cejuela cuando la ventana incluye el aire", () => {
    const { container } = render(
      <Fretboard positions={[]} fromFret={0} frets={4} title="Primera posición" />,
    );
    expect(container.querySelectorAll("rect").length).toBeGreaterThan(0);
  });

  it("no pinta notas fuera de la ventana", () => {
    const { container } = render(
      <Fretboard positions={PENTATONIC_A} fromFret={5} frets={8} title="Caja 1" />,
    );
    // 12 notas de la caja: dos por cuerda
    expect(container.querySelectorAll("title")).toHaveLength(12);
  });

  it("el mástil completo sigue numerando solo los marcadores", () => {
    const { container } = render(
      <Fretboard positions={[]} frets={15} title="Mástil entero" />,
    );
    expect(fretNumbers(container)).toEqual(["3", "5", "7", "9", "12", "15"]);
  });

  it("la raíz es cuadrado y el resto círculos, para no depender del color", () => {
    const { container } = render(
      <Fretboard
        positions={windowPositions(PENTATONIC_A, { fromFret: 5, toFret: 8 })}
        fromFret={5}
        frets={8}
        title="Caja 1"
      />,
    );
    const notes = [...container.querySelectorAll("g")].filter((g) =>
      g.querySelector("title"),
    );
    expect(notes).toHaveLength(12);
    // 3 raíces (A) en la caja del traste 5, dibujadas como cuadrado
    expect(notes.filter((g) => g.querySelector("rect"))).toHaveLength(3);
    expect(notes.filter((g) => g.querySelector("circle"))).toHaveLength(9);
  });
});
