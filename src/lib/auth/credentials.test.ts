import { describe, expect, it } from "vitest";
import { validateCredentials } from "./credentials";

describe("validateCredentials", () => {
  it("acepta unas credenciales normales", () => {
    expect(
      validateCredentials({ email: "ana@trastea.app", password: "12345678" }),
    ).toEqual({});
  });

  it("pide el email cuando está vacío o en blanco", () => {
    expect(validateCredentials({ email: "", password: "12345678" }).email).toBe(
      "Escribe tu email",
    );
    expect(validateCredentials({ email: "   ", password: "12345678" }).email).toBe(
      "Escribe tu email",
    );
  });

  it.each([
    "ana",
    "ana@",
    "@trastea.app",
    "ana@trastea",
    "ana trastea@correo.com",
    "ana@@trastea.app",
    "ana@trastea..app",
    "ana@trastea.app.",
  ])("rechaza %s", (email) => {
    expect(validateCredentials({ email, password: "12345678" }).email).toBe(
      "Email inválido",
    );
  });

  it.each([
    "ana@trastea.app",
    "ANA@TRASTEA.APP",
    "ana.fuentes+guitarra@sub.dominio.co.uk",
    "a_b-c@d.es",
  ])("acepta %s", (email) => {
    expect(validateCredentials({ email, password: "12345678" }).email).toBeUndefined();
  });

  it("exige ocho caracteres de contraseña", () => {
    expect(validateCredentials({ email: "a@b.es", password: "1234567" }).password).toBe(
      "Mínimo 8 caracteres",
    );
    expect(
      validateCredentials({ email: "a@b.es", password: "12345678" }).password,
    ).toBeUndefined();
  });

  it("no recorta la contraseña: los espacios cuentan", () => {
    expect(
      validateCredentials({ email: "a@b.es", password: "        " }).password,
    ).toBeUndefined();
  });

  it("señala los dos campos a la vez cuando los dos fallan", () => {
    expect(validateCredentials({ email: "no", password: "corta" })).toEqual({
      email: "Email inválido",
      password: "Mínimo 8 caracteres",
    });
  });
});
