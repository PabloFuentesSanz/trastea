import { expect, test } from "@playwright/test";

test.describe("entrenamientos con la guitarra", () => {
  test("ritmo a golpe arranca, cuenta golpes y da un resumen", async ({ page }) => {
    await page.goto("/entrenar/ritmo-a-golpe?nivel=2");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Ritmo a golpe");
    await page.getByRole("button", { name: /arrancar a 80 bpm/i }).click();
    const golpe = page.getByRole("button", { name: /marcar el pulso/i });
    await expect(golpe).toBeVisible();
    // cuatro de entrada y uno que cuenta
    for (let i = 0; i < 5; i += 1) {
      await page.waitForTimeout(120);
      await golpe.click();
    }
    await expect(page.locator('[aria-live="polite"]').first()).toContainText("1");
    await page.getByRole("button", { name: /parar antes/i }).click();
    await expect(page.getByText(/Dentro de ±/)).toBeVisible();
  });

  test("el rasgueo con el click dibuja el patrón elegido sobre el bucle elegido", async ({
    page,
  }) => {
    await page.goto("/entrenar/rasgueo");
    await page.getByRole("button", { name: /El de siempre/ }).click();
    await page.getByRole("button", { name: /G · D · Em · C/ }).click();
    const dibujo = page.getByRole("img", { name: /patrón de rasgueo/i });
    await expect(dibujo).toBeVisible();
    await expect(page.getByText("Em", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /oír el rasgueo/i })).toBeVisible();
  });

  test("los tres salen en el catálogo de /entrenar", async ({ page }) => {
    await page.goto("/entrenar?modo=cronometrado");
    await expect(
      page.getByRole("link", { name: /cambios de acorde en un minuto/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /ritmo a golpe/i })).toBeVisible();
  });
});
