import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Accesibilidad de cada pantalla con axe-core, en modo normal y en alto
 * contraste, con las tres cuentas demo del seed. Reglas WCAG 2.0/2.1/2.2 A y AA.
 * Criterio de salida de la Fase 1: 0 violaciones.
 */

const CUENTAS = {
  paciente: { titulo: "María G.", destino: "/paciente" },
  cuidador: { titulo: "Carmen T.", destino: "/cuidador" },
  profesional: { titulo: "E. Rojas", destino: "/profesional" },
} as const;

type Rol = keyof typeof CUENTAS | null;

const PANTALLAS: { ruta: string; rol: Rol }[] = [
  { ruta: "/", rol: null },
  { ruta: "/acceso", rol: null },
  { ruta: "/ayuda", rol: null },
  { ruta: "/paciente", rol: "paciente" },
  { ruta: "/paciente/medicacion", rol: "paciente" },
  { ruta: "/preguntar", rol: "paciente" },
  { ruta: "/cuidador", rol: "cuidador" },
  { ruta: "/cuidador/captura", rol: "cuidador" },
  { ruta: "/cuidador/medicacion", rol: "cuidador" },
  { ruta: "/profesional", rol: "profesional" },
];

/** Entra como lo haría una persona: desde la pantalla de acceso. */
async function entrar(page: Page, rol: keyof typeof CUENTAS) {
  const { titulo, destino } = CUENTAS[rol];
  await page.goto("/acceso");
  await page.getByRole("button", { name: new RegExp(titulo) }).click();
  await page.waitForURL(`**${destino}`);
}

async function auditar(page: Page) {
  // Espera a que termine de cargar datos del backend antes de auditar.
  await page.waitForLoadState("networkidle");
  const resultado = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  return resultado.violations.map(
    (v) => `${v.id} (${v.impact}): ${v.help} → ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`,
  );
}

for (const modo of ["normal", "alto"] as const) {
  for (const { ruta, rol } of PANTALLAS) {
    test(`axe: ${ruta} (${rol ?? "sin sesión"}, contraste ${modo})`, async ({ page }) => {
      if (rol) await entrar(page, rol);
      if (modo === "alto") {
        await page.addInitScript(() => window.localStorage.setItem("contigo.contraste", "alto"));
      }
      await page.goto(ruta);
      if (modo === "alto") {
        await expect(page.locator("html")).toHaveAttribute("data-contraste", "alto");
      }
      expect(await auditar(page)).toEqual([]);
    });
  }
}

test("el modo de alto contraste se activa, se recuerda y se desactiva", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  const boton = page.getByRole("button", { name: "Contraste alto" });

  await expect(boton).toHaveAttribute("aria-pressed", "false");
  await boton.click();
  await expect(html).toHaveAttribute("data-contraste", "alto");
  await expect(boton).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await expect(html).toHaveAttribute("data-contraste", "alto"); // sin parpadeo ni pérdida

  await page.getByRole("button", { name: "Contraste alto" }).click();
  await expect(html).not.toHaveAttribute("data-contraste", "alto");
});

test("la pantalla de ayuda ofrece la línea de emergencia a un toque", async ({ page }) => {
  await page.goto("/ayuda");
  await expect(page.locator('a[href^="tel:131"]').first()).toBeVisible();
});

test("los controles interactivos miden al menos 44 px de alto (móvil)", async ({ page }, info) => {
  test.skip(info.project.name !== "movil", "solo aplica al teléfono");
  await entrar(page, "paciente");
  await page.waitForLoadState("networkidle");
  const chicos = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("button, a[href], [role='button'], input, select")]
      .filter((el) => el.offsetParent !== null)
      .map((el) => ({ txt: (el.innerText || el.getAttribute("aria-label") || el.tagName).trim().slice(0, 30), alto: Math.round(el.getBoundingClientRect().height) }))
      .filter((c) => c.alto < 44),
  );
  expect(chicos, `controles bajo 44 px: ${JSON.stringify(chicos)}`).toEqual([]);
});
