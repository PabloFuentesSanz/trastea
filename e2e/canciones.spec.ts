import { expect, test } from "@playwright/test";

test.describe("canciones", () => {
  test("la ficha explica qué aprendes, cómo se toca y por dónde empezar", async ({
    page,
  }) => {
    await page.goto("/canciones/wonderwall");
    for (const titulo of [
      "Qué aprendes",
      "Cómo se toca",
      "Por dónde empezar",
      "En qué fijarte",
    ]) {
      await expect(page.getByRole("heading", { name: titulo })).toBeVisible();
    }
  });

  test("el orden del catálogo vive en la URL", async ({ page }) => {
    await page.goto("/canciones?nivel=1");
    await page.getByRole("combobox", { name: /ordenar las canciones/i }).click();
    await page.getByRole("option", { name: /por título/i }).click();
    await expect(page).toHaveURL(/orden=titulo/);
    const titulos = await page.locator("main li a span.font-medium").allInnerTexts();
    const ordenados = [...titulos].sort((a, b) => a.localeCompare(b, "es"));
    expect(titulos.slice(0, 5)).toEqual(ordenados.slice(0, 5));
  });
});
