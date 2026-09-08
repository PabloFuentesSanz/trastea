import { expect, test } from "@playwright/test";

test.describe("cambios de acorde en un minuto", () => {
  test("se elige una pareja, se dibujan sus dos acordes y se cuenta con el botón y con espacio", async ({
    page,
  }) => {
    await page.goto("/entrenar/cambios-de-acorde?pareja=a-d");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Cambios de acorde");
    // los dos diagramas de la pareja
    expect(await page.locator('svg[role="img"]').count()).toBeGreaterThanOrEqual(2);
    await expect(page.getByRole("link", { name: /A ↔ D/ })).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.getByRole("button", { name: /arrancar el minuto/i }).click();
    const contador = page.getByRole("button", { name: /un cambio limpio más/i });
    await contador.click();
    await contador.click();
    await page.keyboard.press("Space");
    await expect(page.locator('[aria-live="polite"]').first()).toHaveText("3");

    await page.getByRole("button", { name: /parar antes/i }).click();
    await expect(page.getByText(/cambios por minuto/)).toBeVisible();
    await expect(page.getByRole("button", { name: /otro minuto/i })).toBeVisible();
  });

  test("desde la lección se llega al entrenamiento", async ({ page }) => {
    await page.goto("/curso/desde-cero/desde-cero-w02-d1");
    await page.getByRole("button", { name: /abrir bloque/i }).nth(1).click();
    await page.getByRole("link", { name: /cambios de acorde/i }).first().click();
    await expect(page).toHaveURL(/\/entrenar\/cambios-de-acorde/);
  });
});
