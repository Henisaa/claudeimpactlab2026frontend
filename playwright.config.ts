import { defineConfig } from "@playwright/test";

/**
 * Pruebas de accesibilidad y de interfaz (npm run test:a11y).
 *
 * Requisitos: el backend corriendo en http://localhost:4000 con `npm run seed`
 * y CORS_ORIGINS=http://localhost:3100 (el puerto de esta prueba)
 * (usa las cuentas demo) y el frontend compilado con
 * NEXT_PUBLIC_BACKEND_URL=http://localhost:4000 (`npm run build`).
 *
 * Navegador: por defecto el Chromium de Playwright (`npx playwright install
 * chromium`). En Windows se puede usar Edge ya instalado con PW_CHANNEL=msedge.
 */
export default defineConfig({
  testDir: "e2e",
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3100",
    channel: process.env.PW_CHANNEL || undefined,
    locale: "es-CL",
  },
  projects: [
    // El caso de uso principal: teléfono de bolsillo.
    { name: "movil", use: { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true } },
    // Panel del profesional y revisión en computador.
    { name: "escritorio", use: { viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: "npm run start -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
