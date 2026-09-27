/**
 * Verifica el contraste WCAG de la paleta leyendo los tokens REALES de
 * src/app/globals.css (no una copia): si alguien cambia un color y rompe el
 * contraste, este script falla.
 *
 *   npm run contraste
 *
 * Umbrales: 4,5:1 texto normal (WCAG 1.4.3) · 3:1 gráficos y bordes de
 * controles (WCAG 1.4.11) · 7:1 texto principal (AAA, meta del sistema).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const aqui = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(aqui, "..", "src", "app", "globals.css"), "utf8");

/** Lee `--color-x: oklch(L C h)` de un bloque. */
function leerTokens(bloque) {
  const tokens = {};
  for (const m of bloque.matchAll(/--color-([\w-]+):\s*oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/g)) {
    tokens[m[1]] = [Number(m[2]), Number(m[3]), Number(m[4])];
  }
  return tokens;
}

const bloqueTema = css.match(/@theme\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
const bloqueAlto = css.match(/:root\[data-contraste="alto"\]\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
const normal = leerTokens(bloqueTema);
const alto = { ...normal, ...leerTokens(bloqueAlto) };

// OKLCH -> sRGB lineal (Björn Ottosson) -> luminancia relativa WCAG.
function aLineal([L, C, h]) {
  const a = C * Math.cos((h * Math.PI) / 180);
  const b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((x) => Math.min(1, Math.max(0, x)));
}
const luminancia = (rgb) => 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
const BLANCO = [1, 1, 1];

function razon(a, b) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** [primer plano, fondo, mínimo, dónde se usa]. "blanco" = #fff literal. */
const PARES = [
  ["tinta", "papel", 7, "texto principal"],
  ["tinta", "papel-alto", 7, "texto en tarjetas"],
  ["tinta-media", "papel", 4.5, "texto secundario"],
  ["tinta-media", "papel-hondo", 4.5, "texto en fondos hundidos"],
  ["tinta-tenue", "papel", 4.5, "metadatos"],
  ["tinta-tenue", "papel-alto", 4.5, "metadatos en tarjetas"],
  ["tinta-tenue", "papel-hondo", 4.5, "metadatos en fondos hundidos"],
  ["primario", "papel-alto", 4.5, "enlaces y acciones"],
  ["blanco", "primario", 4.5, "botón primario"],
  ["blanco", "primario-hondo", 4.5, "botón primario al pasar el cursor"],
  ["primario-hondo", "primario-claro", 4.5, "botón secundario / chips"],
  ["verde", "verde-claro", 4.5, "estado: todo bien"],
  ["ambar-texto", "ambar-claro", 4.5, "estado: atención (texto)"],
  ["rojo", "rojo-claro", 4.5, "estado: urgente"],
  ["blanco", "rojo", 4.5, "botón de emergencia"],
  ["info", "info-claro", 4.5, "aviso neutro"],
  ["tinta", "ambar-claro", 4.5, "texto sobre aviso ámbar"],
  ["tinta", "rojo-claro", 4.5, "texto sobre aviso rojo"],
  // Gráficos y controles (3:1)
  ["borde-control", "papel-alto", 3, "borde de campos"],
  ["borde-control", "papel", 3, "borde de campos sobre fondo"],
  ["ambar", "ambar-claro", 3, "ícono de estado ámbar"],
  ["verde", "verde-claro", 3, "ícono de estado verde"],
  ["rojo", "rojo-claro", 3, "ícono de estado rojo"],
  ["primario-hondo", "papel", 3, "anillo de foco"],
];

let fallos = 0;
for (const [modo, t] of [["normal", normal], ["alto contraste", alto]]) {
  console.log(`\n== Modo ${modo}`);
  for (const [fg, bg, minimo, uso] of PARES) {
    const colorFg = fg === "blanco" ? BLANCO : t[fg] && aLineal(t[fg]);
    const colorBg = t[bg] && aLineal(t[bg]);
    if (!colorFg || !colorBg) {
      console.log(`FALTA  token no encontrado: ${fg} / ${bg}`);
      fallos++;
      continue;
    }
    const r = razon(colorFg, colorBg);
    const ok = r >= minimo;
    if (!ok) fallos++;
    console.log(`${ok ? "OK   " : "FALLA"} ${r.toFixed(2).padStart(5)}:1 (mín ${minimo})  ${fg} sobre ${bg} — ${uso}`);
  }
}
console.log(fallos ? `\n${fallos} par(es) no cumplen` : "\nTodos los pares cumplen");
process.exit(fallos ? 1 : 0);
