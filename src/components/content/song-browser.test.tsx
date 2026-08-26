import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SongBrowser } from "./song-browser";
import type { SongCard } from "@/lib/content/song-filter";

const replace = vi.fn();
let currentParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/canciones",
  useSearchParams: () => currentParams,
}));

const CATALOG: SongCard[] = [
  {
    slug: "cuatro-acordes",
    title: "Cuatro acordes",
    artist: "Los Fáciles",
    level: 1,
    key: "C",
    purpose: "Cuatro acordes abiertos y a cantar.",
    style: "pop",
    techniques: ["acordes-abiertos", "rasgueo"],
    collections: ["primeras-canciones"],
    chords: ["C", "G", "Am", "F"],
  },
  {
    slug: "riff-pesado",
    title: "Riff pesado",
    artist: "Los Yunques",
    level: 4,
    key: "Em",
    purpose: "Downpicking sin descanso.",
    style: "metal",
    techniques: ["downpicking", "palm-mute"],
    collections: ["metal-resistencia"],
    chords: ["E5", "G5"],
  },
];

beforeEach(() => {
  replace.mockClear();
  currentParams = new URLSearchParams();
});

describe("SongBrowser", () => {
  it("muestra el recuento y todas las canciones sin filtros", () => {
    render(<SongBrowser songs={CATALOG} />);
    expect(screen.getByText(/de 2 canciones/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Cuatro acordes/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Riff pesado/ })).toBeInTheDocument();
  });

  it("ofrece las colecciones con repertorio como punto de entrada", () => {
    render(<SongBrowser songs={CATALOG} />);
    const portada = screen.getByRole("region", { name: "Por dónde empezar" });
    expect(
      within(portada).getByRole("button", { name: /Tus primeras canciones/ }),
    ).toBeInTheDocument();
  });

  it("al pulsar un nivel escribe el filtro en la URL", async () => {
    const user = userEvent.setup();
    render(<SongBrowser songs={CATALOG} />);
    await user.click(screen.getByRole("button", { name: /Primeros acordes/ }));
    expect(replace).toHaveBeenCalledWith("/canciones?nivel=1", { scroll: false });
  });

  it("respeta el filtro que llega en la URL (deep link desde una lección)", () => {
    currentParams = new URLSearchParams("tecnica=downpicking");
    render(<SongBrowser songs={CATALOG} />);
    expect(screen.getByText(/de 2 canciones/)).toHaveTextContent("1 de 2 canciones");
    expect(screen.getByRole("link", { name: /Riff pesado/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Cuatro acordes/ }),
    ).not.toBeInTheDocument();
  });

  it("marca como pulsada la faceta activa, para lectores de pantalla", () => {
    currentParams = new URLSearchParams("nivel=4");
    render(<SongBrowser songs={CATALOG} />);
    expect(screen.getByRole("button", { name: /Avanzado/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /Primeros acordes/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("desactiva las facetas que no darían resultados", () => {
    currentParams = new URLSearchParams("nivel=1");
    render(<SongBrowser songs={CATALOG} />);
    expect(screen.getByRole("button", { name: /Metal: resistencia/ })).toBeDisabled();
  });

  it("explica qué hacer cuando no queda nada", () => {
    currentParams = new URLSearchParams("q=noexiste");
    render(<SongBrowser songs={CATALOG} />);
    expect(screen.getByText(/Nada encaja con eso/)).toBeInTheDocument();
  });
});
