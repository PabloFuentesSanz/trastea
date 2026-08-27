import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlayableFretboard } from "./playable-fretboard";
import { formulaPositions } from "@/lib/music/fretboard";
import { getTuning } from "@/data/tunings";

const tocadas: { midis: number[]; opciones: unknown }[] = [];
vi.mock("@/lib/audio/pluck", () => ({
  playNotes: (midis: number[], opciones: unknown) => {
    tocadas.push({ midis, opciones });
    return Promise.resolve(0);
  },
}));

const TRIADA_C = formulaPositions({
  root: "C",
  intervals: ["1", "3", "5"],
  tuningMidi: getTuning("standard").midi,
  frets: 5,
});

beforeEach(() => {
  tocadas.length = 0;
});

describe("<PlayableFretboard />", () => {
  it("toca solo la nota que se pulsa", async () => {
    render(<PlayableFretboard positions={TRIADA_C} title="Do mayor" />);
    const notas = screen.getAllByRole("button", { name: /^Cuerda/ });

    await userEvent.click(notas[0]);

    expect(tocadas).toHaveLength(1);
    expect(tocadas[0].midis).toHaveLength(1);
  });

  it("escucha el dibujo entero de grave a agudo y sin repetir el mismo sonido", async () => {
    render(<PlayableFretboard positions={TRIADA_C} title="Do mayor" />);

    await userEvent.click(screen.getByRole("button", { name: "Escuchar" }));

    const { midis } = tocadas[0];
    expect(midis).toEqual([...midis].sort((a, b) => a - b));
    expect(new Set(midis).size).toBe(midis.length);
  });

  it("un acorde se rasguea, una escala se toca nota a nota", async () => {
    const { unmount } = render(
      <PlayableFretboard positions={TRIADA_C} title="Do mayor" modo="acorde" />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Escuchar" }));
    expect(tocadas[0].opciones).toHaveProperty("strum");
    unmount();

    render(<PlayableFretboard positions={TRIADA_C} title="Do mayor" />);
    await userEvent.click(screen.getByRole("button", { name: "Escuchar" }));
    expect(tocadas[1].opciones).toHaveProperty("gap");
  });
});
