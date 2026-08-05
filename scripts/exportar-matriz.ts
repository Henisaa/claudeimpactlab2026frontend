/**
 * Exporta MATRIZ_ETC a JSON para que el backend la consuma como configuración.
 *
 * La fuente de verdad de la matriz sigue siendo src/lib/matriz-etc.ts.
 * Correr con Node >= 23 (type stripping nativo):
 *
 *   node scripts/exportar-matriz.ts
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MATRIZ_ETC } from "../src/lib/matriz-etc.ts";

const aqui = dirname(fileURLToPath(import.meta.url));
const destino = join(
  aqui,
  "..",
  "..",
  "claudeimpactlab2026backend",
  "data",
  "matriz-etc.json",
);

mkdirSync(dirname(destino), { recursive: true });
writeFileSync(destino, JSON.stringify(MATRIZ_ETC, null, 2), "utf8");
console.log(`Matriz ${MATRIZ_ETC.id} exportada a ${destino}`);
