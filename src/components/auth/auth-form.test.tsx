import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthForm } from "./auth-form";

const signInWithPassword = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/supabase/client", () => ({
  isSupabaseConfigured: () => true,
  createClient: () => ({ auth: { signInWithPassword } }),
}));

beforeEach(() => {
  signInWithPassword.mockReset();
  signInWithPassword.mockResolvedValue({ error: null });
});

describe("AuthForm", () => {
  it("no llama a Supabase con datos que ya se ven mal", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="login" />);

    await user.type(screen.getByLabelText("Email"), "ana");
    await user.type(screen.getByLabelText("Contraseña"), "corta");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(signInWithPassword).not.toHaveBeenCalled();
    const alertas = screen.getAllByRole("alert").map((a) => a.textContent);
    expect(alertas).toEqual(["Email inválido", "Mínimo 8 caracteres"]);
  });

  it("marca los campos como inválidos y los enlaza con su mensaje", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="login" />);
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    const email = screen.getByLabelText("Email");
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAccessibleDescription("Escribe tu email");
  });

  it("no protesta antes del primer envío", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="login" />);
    await user.type(screen.getByLabelText("Email"), "a");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("el error se quita al corregir, sin tener que reenviar", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="login" />);
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(screen.getAllByRole("alert")).toHaveLength(2);

    await user.type(screen.getByLabelText("Email"), "ana@trastea.app");
    expect(screen.getAllByRole("alert").map((a) => a.textContent)).toEqual([
      "Mínimo 8 caracteres",
    ]);
  });

  it("con los datos bien, entra", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="login" />);

    await user.type(screen.getByLabelText("Email"), "ana@trastea.app");
    await user.type(screen.getByLabelText("Contraseña"), "guitarra12");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "ana@trastea.app",
      password: "guitarra12",
    });
  });

  it("traduce el error de credenciales de Supabase", async () => {
    signInWithPassword.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });
    const user = userEvent.setup();
    render(<AuthForm mode="login" />);

    await user.type(screen.getByLabelText("Email"), "ana@trastea.app");
    await user.type(screen.getByLabelText("Contraseña"), "guitarra12");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email o contraseña incorrectos",
    );
  });
});
