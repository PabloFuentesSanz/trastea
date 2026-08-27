import { expect, test } from "@playwright/test";
import { contarAudio, sonidosEmitidos } from "./helpers";

test.describe("lo que suena", () => {
  test("la base de acordes toca y resalta el compás", async ({ page }) => {
    await contarAudio(page);
    await page.goto("/bases?prog=blues-jazz&tono=G&estilo=swing&bpm=90");

    await page.getByRole("button", { name: /tocar la base/i }).click();
    await expect(page.getByRole("button", { name: /parar la base/i })).toBeVisible();

    await expect
      .poll(() => sonidosEmitidos(page), { timeout: 10_000 })
      .toBeGreaterThan(3);
    await expect(page.locator('li[aria-current="true"]')).toHaveCount(1);
  });

  test("una tab de figuras mezcladas suena y se ve la figuración", async ({ page }) => {
    await contarAudio(page);
    // corcheas → tresillos → semicorcheas en el mismo dibujo
    await page.goto("/curso/c-lenguaje/c-lenguaje-w09-d5");
    const figura = page.locator("figure").filter({ hasText: /Los dos cambios/ });
    await expect(figura).toHaveCount(1);

    // 18 columnas, cada una con su plica
    const svg = figura.locator("svg").first();
    await expect(svg.locator("line[data-stem]")).toHaveCount(18);
    // las barras: 2 pulsos de corcheas (1 barra) + 2 de tresillos (1) +
    // 2 de semicorcheas (2) = 8 líneas. Si esto cambia, la tab ha dejado de
    // decir en qué figura está.
    await expect(svg.locator("line[data-beam]")).toHaveCount(8);
    // y los dos pulsos de tresillos llevan su 3 (el número de compás también
    // dice "3", así que se busca la marca, no el texto)
    await expect(svg.locator("text[data-triplet]")).toHaveCount(2);

    await figura.getByRole("button", { name: /oír la tab/i }).click();
    await expect
      .poll(() => sonidosEmitidos(page), { timeout: 10_000 })
      .toBeGreaterThan(3);
  });

  test("la tab de una lección se oye", async ({ page }) => {
    await contarAudio(page);
    await page.goto("/curso/c-lenguaje/c-lenguaje-w11-d4");

    await page
      .getByRole("button", { name: /oír la tab/i })
      .first()
      .click();
    await expect
      .poll(() => sonidosEmitidos(page), { timeout: 10_000 })
      .toBeGreaterThan(3);
  });

  test("el mástil de la lección suena: cada nota, con ratón y con teclado", async ({
    page,
  }) => {
    await contarAudio(page);
    // día 1: las notas naturales de la 6ª cuerda. Aquí el nombre tiene que
    // atarse al sonido o la semana entera es memorizar por memorizar.
    await page.goto("/curso/a-cimientos/a-cimientos-w01-d1");

    const la = page.getByRole("button", { name: "Cuerda 6, traste 5, La" });
    await la.click();
    await expect.poll(() => sonidosEmitidos(page), { timeout: 10_000 }).toBe(1);

    await la.focus();
    await page.keyboard.press("Enter");
    await expect.poll(() => sonidosEmitidos(page), { timeout: 10_000 }).toBe(2);

    // y el dibujo entero, de grave a agudo
    await page.getByRole("button", { name: "Escuchar" }).first().click();
    await expect
      .poll(() => sonidosEmitidos(page), { timeout: 10_000 })
      .toBeGreaterThan(5);
  });

  test("el metrónomo arranca y para", async ({ page }) => {
    await contarAudio(page);
    await page.goto("/metronomo?bpm=120");

    await page.getByRole("button", { name: /arrancar metrónomo/i }).click();
    await expect(page.getByRole("button", { name: /parar metrónomo/i })).toBeVisible();
    await expect
      .poll(() => sonidosEmitidos(page), { timeout: 10_000 })
      .toBeGreaterThan(2);

    await page.getByRole("button", { name: /parar metrónomo/i }).click();
    await expect(page.getByRole("button", { name: /arrancar metrónomo/i })).toBeVisible();
  });
});
