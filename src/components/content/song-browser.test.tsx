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

  it("las facetas largas empiezan plegadas: solo el nivel está a la vista", () => {
    render(<SongBrowser songs={CATALOG} />);
    // el nivel sí
    expect(screen.getByRole("button", { name: /Primeros acordes/ })).toBeInTheDocument();
    // el estilo no, hasta abrir su panel
    expect(screen.queryByRole("button", { name: /^Metal 1$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Estilo" })).not.toBeInTheDocument();
  });

  it("abre una faceta cada vez", async () => {
    const user = userEvent.setup();
    render(<SongBrowser songs={CATALOG} />);
    await user.click(screen.getByRole("button", { name: /^Estilo/ }));
    expect(screen.getByRole("region", { name: "Estilo" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Colecciones/ }));
    expect(screen.getByRole("region", { name: "Colecciones" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Estilo" })).not.toBeInTheDocument();
  });

  it("cada faceta larga trae su propio buscador", async () => {
    const user = userEvent.setup();
    render(<SongBrowser songs={CATALOG} />);
    await user.click(screen.getByRole("button", { name: /^Qué se practica/ }));
    const panel = screen.getByRole("region", { name: "Qué se practica" });
    const buscador = within(panel).getByRole("searchbox");

    expect(within(panel).getByRole("button", { name: /Palm mute/ })).toBeInTheDocument();
    await user.type(buscador, "downpick");
    expect(
      within(panel).queryByRole("button", { name: /Palm mute/ }),
    ).not.toBeInTheDocument();
    expect(
      within(panel).getByRole("button", { name: /Downpicking/ }),
    ).toBeInTheDocument();
  });

  it("lo que está filtrado se ve como chip y se puede quitar de uno en uno", async () => {
    const user = userEvent.setup();
    currentParams = new URLSearchParams("nivel=1&tecnica=rasgueo");
    render(<SongBrowser songs={CATALOG} />);

    expect(
      screen.getByRole("button", { name: "Quitar filtro Primeros acordes" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Quitar filtro Rasgueo" }));
    expect(replace).toHaveBeenCalledWith("/canciones?nivel=1", { scroll: false });
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
    // ^ para no chocar con el chip "Quitar filtro Avanzado" de la barra
    expect(screen.getByRole("button", { name: /^Avanzado/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /^Primeros acordes/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("desactiva las facetas que no darían resultados", async () => {
    const user = userEvent.setup();
    currentParams = new URLSearchParams("nivel=1");
    render(<SongBrowser songs={CATALOG} />);
    await user.click(screen.getByRole("button", { name: /^Colecciones/ }));
    expect(screen.getByRole("button", { name: /Metal: resistencia/ })).toBeDisabled();
  });

  it("explica qué hacer cuando no queda nada", () => {
    currentParams = new URLSearchParams("q=noexiste");
    render(<SongBrowser songs={CATALOG} />);
    expect(screen.getByText(/Nada encaja con eso/)).toBeInTheDocument();
  });
});
