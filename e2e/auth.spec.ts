import { expect, test } from "@playwright/test";
import { enModoDemo } from "./helpers";

/**
 * El flujo que necesita base de datos. Sin Supabase configurado la app corre
 * en modo demo y estos tests se saltan solos: así el suite pasa en local y en
 * CI sin credenciales, y cubre el flujo entero en cuanto las hay.
 */
test.describe("registro y progreso", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    test.skip(await enModoDemo(page), "sin Supabase configurado: modo demo");
  });

  test("un usuario nuevo se registra y llega al onboarding", async ({ page }) => {
    const correo = `e2e-${Date.now()}@trastea.test`;
    await page.goto("/registro");
    await page.getByLabel(/correo|email/i).fill(correo);
    await page.getByLabel(/contraseña/i).fill("trastea-e2e-2026");
    await page.getByRole("button", { name: /crear|registrar/i }).click();

    await expect(page).toHaveURL(/\/onboarding|\/hoy|\/$/, { timeout: 15_000 });
  });

  test("completar un bloque queda registrado en el progreso", async ({ page }) => {
    await page.goto("/curso/a-cimientos/a-cimientos-w01-d1");
    const completar = page.getByRole("button", { name: /completar|hecho/i }).first();
    test.skip((await completar.count()) === 0, "sin sesión iniciada");

    await completar.click();
    await page.goto("/progreso");
    await expect(page.locator("body")).not.toContainText(/sin datos|todavía nada/i);
  });
});

test("en modo demo se avisa de que no se guarda el progreso", async ({ page }) => {
  await page.goto("/");
  test.skip(!(await enModoDemo(page)), "hay Supabase configurado");
  await expect(page.getByText(/el progreso no se guarda/i)).toBeVisible();
});
