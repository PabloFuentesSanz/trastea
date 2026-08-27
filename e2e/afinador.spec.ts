import path from "node:path";
import { expect, test } from "@playwright/test";

/**
 * El afinador de punta a punta: micrófono falso con un WAV de un La 20 cents
 * bajo, y se comprueba que la app dice exactamente eso.
 *
 * Cubre la cadena entera —getUserMedia, el analizador, la detección de tono y
 * la aguja—, que es justo lo que los tests unitarios no pueden tocar.
 */
const WAV = path.resolve("e2e/fixtures/la-20-cents-baja.wav");

// `test.use` reemplaza launchOptions entero, así que hay que repetir aquí el
// E2E_CHROMIUM del config: si no, Playwright busca su propio navegador.
test.use({
  permissions: ["microphone"],
  launchOptions: {
    ...(process.env.E2E_CHROMIUM ? { executablePath: process.env.E2E_CHROMIUM } : {}),
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
      // sin sufijo, Chromium repite el fichero en bucle. Con `%noloop` el WAV
      // se acababa antes de que la página llegara a leerlo cuando la máquina
      // iba cargada, y el test fallaba una vez de cada tres.
      `--use-file-for-fake-audio-capture=${WAV}`,
    ],
  },
});

test("el afinador oye una cuerda y dice cuánto le falta", async ({ page }) => {
  await page.goto("/afinador");
  await page.getByRole("button", { name: /escuchar con el micrófono/i }).click();

  // el bucle tiene que aguantar más que el WAV: si se acaba, la lectura
  // desaparece y el test se vuelve una moneda al aire
  await page.waitForTimeout(7000);

  const panel = page.locator("[aria-live='polite']").first();
  // la nota y la cuerda
  await expect(panel).toContainText("A", { timeout: 10_000 });
  await expect(panel).toContainText("5ª cuerda");
  // y el diagnóstico: baja, y hay que tensar
  await expect(panel).toContainText(/cents baja — tensa/);

  // la aguja lo dice también para quien no ve el dibujo
  const aguja = page.locator("svg[role='img']").first();
  const etiqueta = await aguja.getAttribute("aria-label");
  expect(etiqueta).toMatch(/-1[5-9] cents baja|-2[0-5] cents baja/);
});

test("sin micrófono se puede afinar de oído", async ({ page }) => {
  await page.goto("/afinador");
  // las seis cuerdas suenan aunque no se dé permiso al micro
  await expect(page.getByRole("button", { name: /^Oír la .ª cuerda/ })).toHaveCount(6);
});
