import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Rasgueo } from "./music-blocks";

describe("<Rasgueo>", () => {
  it("dibuja las ocho corcheas con su flecha y se describe para el lector de pantalla", () => {
    render(
      <Rasgueo
        patron="↓ · ↓↑ · ↑ ↓↑"
        acordes="Em"
        queHacer="Rasguea Em sin parar la mano"
      />,
    );
    const dibujo = screen.getByRole("img", { name: /patrón de rasgueo/i });
    expect(dibujo.getAttribute("aria-label")).toContain("1 abajo");
    expect(dibujo.getAttribute("aria-label")).toContain("y arriba");
    expect(screen.getByText("Qué haces:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /oír el rasgueo/i })).toBeInTheDocument();
  });

  it("con varios acordes los enseña en orden, uno por compás", () => {
    render(<Rasgueo patron="D - D U - U D U" acordes="G | D | Em | C" tocable="no" />);
    expect(screen.queryByRole("button", { name: /oír/i })).not.toBeInTheDocument();
    expect(screen.getByText("Em")).toBeInTheDocument();
  });
});
