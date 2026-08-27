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
