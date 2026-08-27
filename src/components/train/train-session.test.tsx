import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrainSession } from "./train-session";
import type { TrainCard } from "@/lib/train/cards";

const gradeCard = vi.fn((..._args: unknown[]) => Promise.resolve({ ok: true }));
const playNotes = vi.fn((..._args: unknown[]) => Promise.resolve(1));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/actions/srs", () => ({
  gradeCard: (...args: unknown[]) => gradeCard(...args),
}));
vi.mock("@/lib/audio/pluck", () => ({
  playNotes: (...args: unknown[]) => playNotes(...args),
}));

const CHOICES = { intervals: [0, 4, 7, 12], chords: ["major", "minor"] };

beforeEach(() => {
  gradeCard.mockReset();
  playNotes.mockClear();
});

function renderCard(card: TrainCard, demo = true) {
  return render(<TrainSession cards={[card]} choices={CHOICES} demo={demo} />);
}

describe("TrainSession", () => {
  it("nota del mástil: acertar lo dice, y con la enarmonía", async () => {
    const user = userEvent.setup();
    // 6ª cuerda traste 5 es La
    renderCard({ type: "fretboard_note", string: 0, fret: 5 });
    await user.click(screen.getByRole("button", { name: "A" }));
    expect(await screen.findByText("¡Esa es!")).toBeInTheDocument();
  });

  it("nota del mástil: fallar enseña cuál era", async () => {
    const user = userEvent.setup();
    renderCard({ type: "fretboard_note", string: 0, fret: 5 });
    await user.click(screen.getByRole("button", { name: "C" }));
    expect(await screen.findByText(/Era A/)).toBeInTheDocument();
  });

  it("no acepta una segunda respuesta a la misma pregunta", async () => {
    const user = userEvent.setup();
    renderCard({ type: "fretboard_note", string: 0, fret: 5 });
    const c = screen.getByRole("button", { name: "C" });
    await user.click(c);
    expect(c).toBeDisabled();
  });

  it("acorde: hay que marcar todas las notas, no una", async () => {
    const user = userEvent.setup();
    renderCard({ type: "chord_notes", root: "C", chordId: "major" });
    await user.click(screen.getByRole("button", { name: "C" }));
    await user.click(screen.getByRole("button", { name: /Comprobar/ }));
    expect(await screen.findByText(/Era C · E · G/)).toBeInTheDocument();
  });

  it("acorde: con las tres, acierto", async () => {
    const user = userEvent.setup();
    renderCard({ type: "chord_notes", root: "C", chordId: "major" });
    for (const n of ["C", "E", "G"]) {
      await user.click(screen.getByRole("button", { name: n }));
    }
    await user.click(screen.getByRole("button", { name: /Comprobar/ }));
    expect(await screen.findByText("¡Esa es!")).toBeInTheDocument();
  });

  it("acorde: el botón de comprobar cuenta lo que llevas marcado", async () => {
    const user = userEvent.setup();
    renderCard({ type: "chord_notes", root: "C", chordId: "major" });
    expect(screen.getByRole("button", { name: /Comprobar \(0\)/ })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "C" }));
    expect(screen.getByRole("button", { name: /Comprobar \(1\)/ })).toBeEnabled();
  });

  it("oído: suena solo al aparecer, sin tener que pedirlo", async () => {
    renderCard({ type: "ear_interval", semitones: 7 });
    expect(playNotes).toHaveBeenCalled();
  });

  it("oído: el enunciado no se chiva del intervalo", () => {
    renderCard({ type: "ear_interval", semitones: 7 });
    // sale en los botones de respuesta, que es donde debe; lo que no puede es
    // salir en la pregunta
    const enunciado = screen.getByText(/¿qué intervalo era\?/i);
    expect(enunciado.textContent).not.toContain("5ª justa");
  });

  it("oído: al fallar sale la canción de referencia", async () => {
    const user = userEvent.setup();
    renderCard({ type: "ear_interval", semitones: 7 });
    await user.click(screen.getByRole("button", { name: /3ª mayor/ }));
    expect(await screen.findByText(/Star Wars/)).toBeInTheDocument();
  });

  it("oído: solo se ofrecen los intervalos del nivel", () => {
    renderCard({ type: "ear_interval", semitones: 7 });
    expect(screen.getByRole("button", { name: /5ª justa/ })).toBeInTheDocument();
    // la 2ª menor no está en CHOICES, así que no debe salir
    expect(screen.queryByRole("button", { name: /2ª menor/ })).not.toBeInTheDocument();
  });

  it("en modo demo no se guarda nada", async () => {
    const user = userEvent.setup();
    renderCard({ type: "fretboard_note", string: 0, fret: 5 }, true);
    await user.click(screen.getByRole("button", { name: "A" }));
    expect(gradeCard).not.toHaveBeenCalled();
  });

  it("con sesión iniciada, la respuesta se guarda con el id de la tarjeta", async () => {
    const user = userEvent.setup();
    renderCard({ type: "fretboard_note", string: 0, fret: 5 }, false);
    await user.click(screen.getByRole("button", { name: "A" }));
    expect(gradeCard).toHaveBeenCalledWith(
      expect.objectContaining({ cardId: "fretboard_note:0:5" }),
    );
  });

  it("construir intervalos: se responde tocando el mástil, sin botones de nota", () => {
    renderCard({ type: "interval_build", from: { string: 4, fret: 3 }, semitones: 7 });
    expect(
      screen.queryByRole("group", { name: /Elige la nota/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cuerda 6, traste 0" }),
    ).toBeInTheDocument();
  });
});
