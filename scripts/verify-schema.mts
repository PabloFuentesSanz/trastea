/**
 * Cada columna que el código pide, ¿existe en la base de datos?
 *
 * El fallo que esto caza no da error en ninguna parte hasta que alguien con
 * la sesión iniciada abre esa pantalla: PostgREST devuelve un error, el código
 * hace `data ?? []` y la página sale vacía como si no hubiera datos. En una
 * app desplegada eso es indistinguible de "todavía no has practicado".
 *
 *   node --import tsx scripts/verify-schema.mts <schema.json>
 *
 * El JSON lo genera scripts/dump-schema.sql contra la base ya migrada.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const FUENTES = ["src/lib/queries.ts", "src/app/actions", "src/app/api"];

/** Métodos de PostgREST cuyo primer argumento es una columna. */
const FILTROS = new Set([
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "like",
  "ilike",
  "is",
  "in",
  "contains",
  "order",
]);

interface Referencia {
  tabla: string;
  columna: string;
  fichero: string;
  linea: number;
}

function ficherosTs(entrada: string): string[] {
  const full = path.join(ROOT, entrada);
  if (!fs.existsSync(full)) return [];
  if (fs.statSync(full).isFile()) return [full];
  return fs
    .readdirSync(full, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory()
        ? ficherosTs(path.join(entrada, e.name))
        : e.name.endsWith(".ts") || e.name.endsWith(".tsx")
          ? [path.join(full, e.name)]
          : [],
    );
}

const lineaDe = (texto: string, indice: number) =>
  texto.slice(0, indice).split("\n").length;

/** Las columnas que el código nombra de cada tabla. */
function referencias(fichero: string): Referencia[] {
  const texto = fs.readFileSync(fichero, "utf8");
  const rel = path.relative(ROOT, fichero);
  const out: Referencia[] = [];

  for (const m of texto.matchAll(/\.from\(\s*"([a-z_]+)"\s*\)/g)) {
    const tabla = m[1];
    // la cadena de llamadas llega hasta el siguiente `.from(` o el final del
    // bloque: con mirar un trozo generoso basta y no hace falta un parser
    const desde = m.index + m[0].length;
    const siguiente = texto.indexOf('.from("', desde);
    const trozo = texto.slice(desde, siguiente === -1 ? desde + 900 : siguiente);

    for (const s of trozo.matchAll(/\.select\(\s*"([^"]*)"/g)) {
      for (const col of s[1].split(",").map((c) => c.trim())) {
        if (!col || col === "*" || col.includes("->") || col.includes("(")) continue;
        out.push({ tabla, columna: col, fichero: rel, linea: lineaDe(texto, desde) });
      }
    }
    for (const f of trozo.matchAll(/\.([a-z]+)\(\s*"([^"]+)"/g)) {
      if (!FILTROS.has(f[1])) continue;
      const col = f[2].trim();
      if (col.includes("->") || col.includes("(")) continue;
      out.push({ tabla, columna: col, fichero: rel, linea: lineaDe(texto, desde) });
    }
  }
  return out;
}

const rutaJson = process.argv[2];
if (!rutaJson) {
  console.error("Falta el JSON del esquema (lo genera scripts/dump-schema.sql)");
  process.exit(1);
}
const esquema = JSON.parse(fs.readFileSync(rutaJson, "utf8")) as Record<string, string[]>;

const todas = FUENTES.flatMap(ficherosTs).flatMap(referencias);
const vistas = new Set<string>();
const errores: string[] = [];

for (const r of todas) {
  const clave = `${r.tabla}.${r.columna}`;
  if (vistas.has(clave)) continue;
  vistas.add(clave);

  const columnas = esquema[r.tabla];
  if (!columnas) {
    errores.push(`${r.fichero}:${r.linea} — la tabla "${r.tabla}" no existe en la base`);
    continue;
  }
  if (!columnas.includes(r.columna)) {
    errores.push(
      `${r.fichero}:${r.linea} — ${r.tabla}.${r.columna} no existe (tiene: ${columnas.join(", ")})`,
    );
  }
}

const tablas = new Set(todas.map((r) => r.tabla));
console.log(
  `verify-schema — ${vistas.size} columnas de ${tablas.size} tablas, comprobadas contra el esquema aplicado`,
);
if (errores.length > 0) {
  console.error(`\n❌ ${errores.length} referencias rotas:`);
  for (const e of errores) console.error("  ", e);
  process.exit(1);
}
console.log("✅ el código y la base de datos dicen lo mismo");
