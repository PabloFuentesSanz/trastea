import { defineConfig, devices } from "@playwright/test";

/**
 * E2E del flujo crítico. Arranca la app en modo producción —lo que se
 * despliega, no el dev server— y la recorre con un navegador de verdad.
 *
 * Los tests que necesitan base de datos se saltan solos si no hay Supabase
 * configurado (ver e2e/auth.spec.ts): así el suite pasa en local y en CI sin
 * credenciales, y cubre el flujo entero en cuanto las hay.
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

/**
 * Normalmente Playwright usa el Chromium que instala él. `E2E_CHROMIUM`
 * permite apuntar a uno ya presente (contenedores, CI con imagen propia)
 * sin tener que descargarlo.
 */
const launchOptions = process.env.E2E_CHROMIUM
  ? { executablePath: process.env.E2E_CHROMIUM }
  : undefined;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  timeout: 30_000,
  expect: { timeout: 7_000 },

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "escritorio",
      use: { ...devices["Desktop Chrome"], launchOptions },
    },
    {
      name: "movil",
      use: { ...devices["Pixel 7"], launchOptions },
    },
  ],

  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `pnpm build && pnpm start --port ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
      },
});
