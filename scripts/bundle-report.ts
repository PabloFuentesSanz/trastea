/**
 * Cuánto JavaScript baja cada ruta, y un presupuesto que rompe el CI cuando
 * engorda.
 *
 * Turbopack no imprime tamaños, así que se miden donde están de verdad: en el
 * HTML ya construido. Cada página lista sus <script>, se comprime cada trozo
 * con gzip y se suma. Los polyfills llevan `noModule`, o sea que un navegador
 * moderno no los baja: no cuentan.
 *
 *   pnpm bundle:report            informe
 *   pnpm bundle:report --check    además falla si alguna ruta pasa su tope
 */

import { gzipSync } from "node:zlib";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const NEXT = ".next";
const APP = join(NEXT, "server", "app");

/**
 * Topes en kB de JS de primera carga (gzip, sin polyfills). Son el techo, no
 * el objetivo: si un cambio los rompe, o adelgaza o se sube el número **a
 * conciencia** y dejando dicho por qué.
 */
const BUDGET: { pattern: RegExp; kb: number; nota: string }[] = [
  {
    pattern: /^perfil/,
    kb: 265,
    nota: "el cliente de Supabase entero para editar la cuenta",
  },
  { pattern: /^(login|registro)/, kb: 225, nota: "el cliente de Supabase para entrar" },
  { pattern: /./, kb: 235, nota: "techo general" },
];

const SCRIPT = /\/_next\/(static\/[^"'\\ )]+?\.js)/g;
// `noModule` puede ir antes o después del `src`, así que se mira la etiqueta entera
const TAG = /<script\b[^>]*>/gi;
const SRC = /src="\/_next\/(static\/[^"]+?\.js)"/i;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory()
      ? walk(full)
      : name.endsWith(".html")
        ? [full]
        : [];
  });
}

function gzipKb(chunk: string, cache: Map<string, number>): number {
  const hit = cache.get(chunk);
  if (hit !== undefined) return hit;
  const path = join(NEXT, chunk);
  const size = existsSync(path)
    ? gzipSync(readFileSync(path), { level: 9 }).length / 1024
    : 0;
  cache.set(chunk, size);
  return size;
}

function budgetFor(route: string) {
  return BUDGET.find((b) => b.pattern.test(route)) ?? BUDGET[BUDGET.length - 1];
}

function main() {
  if (!existsSync(APP)) {
    console.error("No hay build. Ejecuta `pnpm build` antes que esto.");
    process.exit(1);
  }

  const cache = new Map<string, number>();
  const pages = walk(APP).map((file) => {
    const html = readFileSync(file, "utf8");
    const legacy = new Set(
      [...html.matchAll(TAG)]
        .filter((t) => /\bnoModule\b/i.test(t[0]))
        .map((t) => SRC.exec(t[0])?.[1])
        .filter((c): c is string => Boolean(c)),
    );
    const chunks = new Set(
      [...html.matchAll(SCRIPT)].map((m) => m[1]).filter((c) => !legacy.has(c)),
    );
    return {
      route: relative(APP, file),
      chunks,
      kb: [...chunks].reduce((sum, c) => sum + gzipKb(c, cache), 0),
    };
  });

  const compartidos = [...pages[0].chunks].filter((c) =>
    pages.every((p) => p.chunks.has(c)),
  );
  const base = compartidos.reduce((sum, c) => sum + gzipKb(c, cache), 0);

  console.log(`${pages.length} páginas · JS de primera carga, gzip, sin polyfills\n`);
  console.log(
    `Base común a todas: ${base.toFixed(1)} kB en ${compartidos.length} trozos\n`,
  );

  // una fila por grupo de rutas del mismo peso: 429 líneas no las lee nadie
  const grupos = new Map<string, { rutas: string[]; kb: number }>();
  for (const p of pages) {
    const clave = p.kb.toFixed(1);
    const g = grupos.get(clave) ?? { rutas: [], kb: p.kb };
    g.rutas.push(p.route);
    grupos.set(clave, g);
  }

  const ordenados = [...grupos.values()].sort((a, b) => b.kb - a.kb);
  for (const g of ordenados) {
    const muestra = g.rutas.slice(0, 2).join(", ");
    const resto = g.rutas.length > 2 ? ` (+${g.rutas.length - 2} más)` : "";
    console.log(`  ${g.kb.toFixed(1).padStart(7)} kB  ${muestra}${resto}`);
  }

  const excedidas = pages
    .map((p) => ({ ...p, budget: budgetFor(p.route) }))
    .filter((p) => p.kb > p.budget.kb);

  if (!process.argv.includes("--check")) return;

  if (excedidas.length > 0) {
    console.error(`\n❌ ${excedidas.length} rutas pasan su presupuesto:\n`);
    for (const p of excedidas.slice(0, 10)) {
      console.error(
        `  ${p.route}: ${p.kb.toFixed(1)} kB > ${p.budget.kb} kB (${p.budget.nota})`,
      );
    }
    if (excedidas.length > 10) console.error(`  … y ${excedidas.length - 10} más`);
    console.error(
      "\nO adelgaza la ruta, o sube el tope en scripts/bundle-report.ts diciendo por qué.",
    );
    process.exit(1);
  }
  console.log("\n✅ todas las rutas dentro de su presupuesto");
}

main();
