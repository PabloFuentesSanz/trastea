/**
 * content:audit — escanea /content, valida frontmatter y referencias, y
 * genera /content/STATE.md con el inventario y los huecos detectados.
 * Sale con código 1 si hay referencias rotas o frontmatter inválido
 * (referencia rota = build rojo, también en CI).
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  SONG_COLLECTIONS,
  SONG_TECHNIQUES,
  collectionLabel,
  techniqueLabel,
} from "../src/lib/content/song-taxonomy";
import {
  exerciseFrontmatterSchema,
  lessonFrontmatterSchema,
  moduleFrontmatterSchema,
  quizFrontmatterSchema,
  songFrontmatterSchema,
  weekFrontmatterSchema,
  wikiFrontmatterSchema,
  type ExerciseFrontmatter,
  type LessonFrontmatter,
  type ModuleFrontmatter,
  type QuizFrontmatter,
  type SongFrontmatter,
  type WeekFrontmatter,
  type WikiFrontmatter,
} from "../src/lib/content/schemas";
import {
  notesThatArent,
  parseFormulaSpec,
  parseNoteSpec,
  pitchClassesOf,
} from "../src/lib/music/spec";
import { validateGrid } from "../src/lib/music/grid";
import { parseFretSpec, voicingFromFrets } from "../src/lib/music/voicing-from-frets";
import { foreignNotes, foreignPerBar, parseTab } from "../src/lib/music/tab";
import { getTuning } from "../src/data/tunings";

const STANDARD_TUNING = getTuning("standard").midi;

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, "content");

interface Problem {
  file: string;
  message: string;
}

const errors: Problem[] = [];
const warnings: Problem[] = [];

function rel(p: string): string {
  return path.relative(ROOT, p);
}

function readMdx(file: string): { data: unknown; body: string } {
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  return { data, body: content };
}

function tryParse<T>(
  file: string,
  data: unknown,
  schema: { parse: (d: unknown) => T },
): T | null {
  try {
    return schema.parse(data);
  } catch (e) {
    errors.push({ file: rel(file), message: `frontmatter inválido: ${String(e)}` });
    return null;
  }
}

// ---------- carga ----------

interface LessonRecord {
  file: string;
  fm: LessonFrontmatter;
  body: string;
  moduleSlug: string;
  weekOrder: number;
}

const modules: { file: string; fm: ModuleFrontmatter }[] = [];
const weeks: {
  file: string;
  fm: WeekFrontmatter;
  moduleSlug: string;
  dayCount: number;
}[] = [];
const lessons: LessonRecord[] = [];

const courseDir = path.join(CONTENT, "course");
if (fs.existsSync(courseDir)) {
  for (const moduleDir of fs.readdirSync(courseDir)) {
    const modulePath = path.join(courseDir, moduleDir);
    const moduleFile = path.join(modulePath, "module.mdx");
    if (!fs.existsSync(moduleFile)) continue;
    const moduleFm = tryParse(
      moduleFile,
      readMdx(moduleFile).data,
      moduleFrontmatterSchema,
    );
    if (!moduleFm) continue;
    modules.push({ file: moduleFile, fm: moduleFm });

    for (const weekDir of fs.readdirSync(modulePath)) {
      const weekPath = path.join(modulePath, weekDir);
      const weekFile = path.join(weekPath, "week.mdx");
      if (!fs.existsSync(weekFile)) continue;
      const weekFm = tryParse(weekFile, readMdx(weekFile).data, weekFrontmatterSchema);
      if (!weekFm) continue;

      const dayFiles = fs.readdirSync(weekPath).filter((f) => /^d\d\.mdx$/.test(f));
      weeks.push({
        file: weekFile,
        fm: weekFm,
        moduleSlug: moduleFm.slug,
        dayCount: dayFiles.length,
      });

      for (const dayFile of dayFiles) {
        const file = path.join(weekPath, dayFile);
        const { data, body } = readMdx(file);
        const fm = tryParse(file, data, lessonFrontmatterSchema);
        if (fm) {
          lessons.push({
            file,
            fm,
            body,
            moduleSlug: moduleFm.slug,
            weekOrder: weekFm.order,
          });
        }
      }
    }
  }
}

function loadFlat<T>(
  dir: string,
  schema: { parse: (d: unknown) => T },
): { file: string; fm: T; body: string }[] {
  const full = path.join(CONTENT, dir);
  if (!fs.existsSync(full)) return [];
  const out: { file: string; fm: T; body: string }[] = [];
  for (const f of fs.readdirSync(full).filter((f) => f.endsWith(".mdx"))) {
    const file = path.join(full, f);
    const { data, body } = readMdx(file);
    const fm = tryParse(file, data, schema);
    if (fm) out.push({ file, fm, body });
  }
  return out;
}

const exercises = loadFlat<ExerciseFrontmatter>("exercises", exerciseFrontmatterSchema);
const songs = loadFlat<SongFrontmatter>("songs", songFrontmatterSchema);
const wikis = loadFlat<WikiFrontmatter>("wiki", wikiFrontmatterSchema);
const quizzes = loadFlat<QuizFrontmatter>("quizzes", quizFrontmatterSchema);

const tabsDir = path.join(CONTENT, "tabs");
const tabs = fs.existsSync(tabsDir)
  ? fs.readdirSync(tabsDir).filter((f) => f.endsWith(".alphatex"))
  : [];

// ---------- índices ----------

const exerciseSlugs = new Set(exercises.map((e) => e.fm.slug));
const songSlugs = new Set(songs.map((s) => s.fm.slug));
const wikiSlugs = new Set(wikis.map((w) => w.fm.slug));
const quizSlugs = new Set(quizzes.map((q) => q.fm.slug));
const tabSlugs = new Set(tabs.map((f) => f.replace(/\.alphatex$/, "")));
const lessonSlugs = new Set(lessons.map((l) => l.fm.slug));

const KNOWN_TOOL_PREFIXES = [
  "/metronomo",
  "/escalas",
  "/acordes",
  "/tabs",
  "/wiki",
  "/curso",
  "/entrenar",
  "/canciones",
];

function checkRef(
  file: string,
  kind: string,
  slug: string,
  known: Set<string>,
  broken: Map<string, string[]>,
) {
  if (!known.has(slug)) {
    errors.push({ file: rel(file), message: `${kind} inexistente: "${slug}"` });
    const list = broken.get(slug) ?? [];
    list.push(rel(file));
    broken.set(slug, list);
  }
}

const brokenRefs = new Map<string, string[]>();

// lecciones → ejercicios, canciones, wiki, tools
for (const { file, fm } of lessons) {
  for (const block of fm.blocks) {
    if (block.exercise)
      checkRef(file, "exercise", block.exercise, exerciseSlugs, brokenRefs);
    if (block.song) checkRef(file, "song", block.song, songSlugs, brokenRefs);
    if (block.tool && !KNOWN_TOOL_PREFIXES.some((p) => block.tool!.startsWith(p))) {
      errors.push({
        file: rel(file),
        message: `tool con ruta desconocida: "${block.tool}"`,
      });
    }
  }
  for (const ref of fm.wiki_refs) checkRef(file, "wiki", ref, wikiSlugs, brokenRefs);
}

// ejercicios → wiki
for (const { file, fm } of exercises) {
  for (const ref of fm.links.wiki) checkRef(file, "wiki", ref, wikiSlugs, brokenRefs);
}

// canciones → wiki y tabs
for (const { file, fm } of songs) {
  for (const ref of fm.wiki_refs) checkRef(file, "wiki", ref, wikiSlugs, brokenRefs);
  if (fm.tab_slug) checkRef(file, "tab", fm.tab_slug, tabSlugs, brokenRefs);
}

// wiki → related e interlinks
const INTERLINK = /\[\[([a-z0-9-]+)(?:\|[^\]]+)?\]\]/g;
const wikiIncoming = new Map<string, number>();
for (const { file, fm, body } of wikis) {
  for (const ref of fm.related) checkRef(file, "wiki", ref, wikiSlugs, brokenRefs);
  for (const match of body.matchAll(INTERLINK)) {
    checkRef(file, "wiki (interlink)", match[1], wikiSlugs, brokenRefs);
    wikiIncoming.set(match[1], (wikiIncoming.get(match[1]) ?? 0) + 1);
  }
  for (const ref of fm.related) {
    wikiIncoming.set(ref, (wikiIncoming.get(ref) ?? 0) + 1);
  }
}
for (const { fm } of lessons) {
  for (const ref of fm.wiki_refs) {
    wikiIncoming.set(ref, (wikiIncoming.get(ref) ?? 0) + 1);
  }
}
for (const { fm } of songs) {
  for (const ref of fm.wiki_refs) {
    wikiIncoming.set(ref, (wikiIncoming.get(ref) ?? 0) + 1);
  }
}
for (const { fm } of exercises) {
  for (const ref of fm.links.wiki) {
    wikiIncoming.set(ref, (wikiIncoming.get(ref) ?? 0) + 1);
  }
}

// módulos → quiz
for (const { file, fm } of modules) {
  if (fm.assessment?.quiz_slug)
    checkRef(file, "quiz", fm.assessment.quiz_slug, quizSlugs, brokenRefs);
}

// Regla de contenido: si un artículo declara de qué escala trata, tiene que
// enseñarla entera — todas las cajas y cuerda a cuerda.
for (const { file, fm, body } of wikis) {
  const scale = fm.scale;
  if (!scale) continue;

  try {
    parseFormulaSpec(scale, "scale");
  } catch (e) {
    errors.push({ file: rel(file), message: (e as Error).message });
    continue;
  }

  const escapada = scale.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tiene = (tag: string) =>
    new RegExp(`<${tag}\\b[^>]*?escala="${escapada}"`).test(body);

  if (!tiene("Cajas")) {
    errors.push({
      file: rel(file),
      message: `trata de "${scale}" pero no muestra todas sus posiciones: falta <Cajas escala="${scale}" />`,
    });
  }
  if (!tiene("PorCuerdas")) {
    errors.push({
      file: rel(file),
      message: `trata de "${scale}" pero no se puede practicar cuerda a cuerda: falta <PorCuerdas escala="${scale}" />`,
    });
  }
}

// Regla de contenido: una lección abre con su ficha y enseña lo que
// introduce. Un día que solo narra es un día que hay que leer dos veces.
for (const { file, body } of lessons) {
  if (!/<Ficha\b/.test(body)) {
    errors.push({
      file: rel(file),
      message: "no tiene <Ficha>: el objetivo y la regla del día no pueden ir enterrados en un párrafo",
    });
  }
}

// Regla de contenido: un ejercicio se dibuja, no se narra. Si pide tocar
// algo, tiene que enseñarlo en un mástil, en una tab o en un diagrama de
// acorde; y la rutina va en <Rutina>, no en una lista numerada de prosa.
const DIBUJA = ["Mastil", "Tab", "Acorde", "Acordes", "Cajas", "PorCuerdas", "Rejilla"];
for (const { file, body } of exercises) {
  const dibuja = DIBUJA.some((tag) => new RegExp(`<${tag}\\b`).test(body));
  if (!dibuja) {
    errors.push({
      file: rel(file),
      message:
        "no dibuja nada: un ejercicio necesita al menos un <Mastil>, <Tab> o <Acorde> que enseñe qué hay que tocar",
    });
  }
  if (!/<Rutina\b/.test(body)) {
    errors.push({
      file: rel(file),
      message:
        "no tiene <Rutina>: los pasos con sus minutos y su bpm no pueden ir en prosa",
    });
  }
}

// Secuenciación: un módulo no puede pedir canciones por encima de su techo.
// Es lo que dejaba un estándar de jazz de nivel 3 en la semana 1.
const songLevel = new Map(songs.map((s) => [s.fm.slug, s.fm.level]));
const moduleMaxSongLevel = new Map(modules.map((m) => [m.fm.slug, m.fm.max_song_level]));

for (const { file, fm, moduleSlug } of lessons) {
  const techo = moduleMaxSongLevel.get(moduleSlug);
  if (techo === undefined) continue;
  for (const block of fm.blocks) {
    if (!block.song) continue;
    const level = songLevel.get(block.song);
    if (level !== undefined && level > techo) {
      errors.push({
        file: rel(file),
        message: `"${block.song}" es de nivel ${level} y este módulo no pasa de ${techo}: demasiado avanzada para esta altura del curso`,
      });
    }
  }
}

// slugs duplicados
function findDuplicates(items: { slug: string; file: string }[], kind: string) {
  const seen = new Map<string, string>();
  for (const { slug, file } of items) {
    const prev = seen.get(slug);
    if (prev) {
      errors.push({
        file: rel(file),
        message: `${kind} con slug duplicado "${slug}" (también en ${prev})`,
      });
    } else {
      seen.set(slug, rel(file));
    }
  }
}
findDuplicates(
  lessons.map((l) => ({ slug: l.fm.slug, file: l.file })),
  "lección",
);
findDuplicates(
  exercises.map((e) => ({ slug: e.fm.slug, file: e.file })),
  "ejercicio",
);
findDuplicates(
  wikis.map((w) => ({ slug: w.fm.slug, file: w.file })),
  "wiki",
);
findDuplicates(
  songs.map((s) => ({ slug: s.fm.slug, file: s.file })),
  "canción",
);

// expresiones MDX: no se evalúan en este pipeline y se pierden en silencio,
// así que un `desde={5}` dibujaría el diagrama equivocado sin avisar.
const MDX_EXPRESSION = /(?:^|\s)([a-zA-Z][a-zA-Z0-9_]*)=\{/;

function checkMdxExpressions(file: string, body: string) {
  body.split("\n").forEach((line, i) => {
    const match = MDX_EXPRESSION.exec(line);
    if (!match) return;
    errors.push({
      file: rel(file),
      message: `línea ${i + 1}: \`${match[1]}={…}\` no se evalúa en MDX y se pierde. Usa comillas: ${match[1]}="…"`,
    });
  });
}

// specs musicales del contenido: un id o cifrado que no existe reventaría en
// runtime con un 500, así que se caza aquí.
const MASTIL_SPEC = /<Mastil\b[^>]*?\b(escala|acorde)="([^"]+)"/g;
const ACORDE_SPEC = /<Acorde\b[^>]*?\bnombre="([^"]+)"/g;
const ACORDE_TAG = /<Acorde\b[^>]*?\/>/g;
const NOTAS_SPEC = /<Mastil\b[^>]*?\bnotas="([^"]+)"/g;
const REJILLA_SPEC = /<Rejilla\b[^>]*?\bcompases="([^"]+)"/g;
const TAB_TAG = /<Tab\b[\s\S]*?\/>/g;
// Una caja NO es un rectángulo de trastes: recortarla con desde/hasta se come
// notas de la vecina y pierde las propias. Se escribe `caja="2"`.
const MASTIL_TAG = /<Mastil\b[^>]*?\/>/g;

function checkMusicSpecs(file: string, body: string) {
  const seen: [string, "scale" | "chord"][] = [];
  for (const m of body.matchAll(MASTIL_SPEC)) {
    seen.push([m[2], m[1] === "escala" ? "scale" : "chord"]);
  }
  for (const m of body.matchAll(ACORDE_SPEC)) seen.push([m[1], "chord"]);

  for (const [spec, kind] of seen) {
    try {
      parseFormulaSpec(spec, kind);
    } catch (e) {
      errors.push({ file: rel(file), message: (e as Error).message });
    }
  }

  // Una digitación escrita a mano puede parsear bien y aun así no ser el
  // acorde: se comprueba que toda cuerda que suena es una nota del acorde.
  for (const m of body.matchAll(ACORDE_TAG)) {
    const tag = m[0];
    const nombre = /nombre="([^"]+)"/.exec(tag)?.[1];
    const trastes = /trastes="([^"]+)"/.exec(tag)?.[1];
    if (!nombre || !trastes) continue;
    try {
      const spec = parseFormulaSpec(nombre, "chord");
      const voicing = voicingFromFrets({
        root: spec.root,
        intervals: spec.intervals,
        frets: parseFretSpec(trastes),
        tuningMidi: STANDARD_TUNING,
      });
      const ajenas = voicing.frets
        .map((fret, string) =>
          fret !== null && voicing.intervals[string] === null ? 6 - string : null,
        )
        .filter((n): n is number => n !== null);
      if (ajenas.length > 0) {
        errors.push({
          file: rel(file),
          message: `${nombre} "${trastes}": la cuerda ${ajenas.join(", ")} no suena una nota del acorde`,
        });
      }
    } catch (e) {
      errors.push({ file: rel(file), message: (e as Error).message });
    }
  }

  // Un mapa de octavas dibuja una sola nota por todo el mástil. Si declara
  // cuál es, se comprueba posición a posición: equivocarse en una no se ve.
  for (const m of body.matchAll(MASTIL_TAG)) {
    const tag = m[0];
    const notas = /\bnotas="([^"]+)"/.exec(tag)?.[1];
    if (!notas) continue;
    try {
      const parsed = parseNoteSpec(notas);
      const solo = /\bsoloNota="([^"]+)"/.exec(tag)?.[1];
      if (solo) {
        const fuera = notesThatArent(parsed, STANDARD_TUNING, solo);
        if (fuera.length > 0) {
          errors.push({
            file: rel(file),
            message: `<Mastil soloNota="${solo}">: ${fuera.join(", ")} no es ${solo}`,
          });
        }
      }
    } catch (e) {
      errors.push({ file: rel(file), message: (e as Error).message });
    }
  }

  // Una tab escrita a mano puede parsear bien y tener un traste mal. Si
  // declara escala, se comprueba que todas sus notas pertenecen a ella.
  for (const m of body.matchAll(TAB_TAG)) {
    const tag = m[0];
    const notas = /\bnotas="([^"]+)"/.exec(tag)?.[1];
    if (!notas) continue;
    try {
      const bars = parseTab(notas);
      const escala = /\bescala="([^"]+)"/.exec(tag)?.[1];
      if (escala) {
        const spec = parseFormulaSpec(escala, "scale");
        const fuera = foreignNotes(bars, pitchClassesOf(spec), STANDARD_TUNING);
        if (fuera.length > 0) {
          errors.push({
            file: rel(file),
            message: `<Tab escala="${escala}">: ${fuera.join(", ")} no está en la escala`,
          });
        }
      }
      const acordes = /\bacordes="([^"]+)"/.exec(tag)?.[1];
      if (acordes) {
        const porCompas = acordes
          .split("|")
          .map((c) => c.trim())
          .filter(Boolean)
          .map((c) => pitchClassesOf(parseFormulaSpec(c, "chord")));
        const fuera = foreignPerBar(bars, porCompas, STANDARD_TUNING);
        if (fuera.length > 0) {
          errors.push({
            file: rel(file),
            message: `<Tab acordes="${acordes}">: ${fuera.join(", ")} no es del acorde de su compás`,
          });
        }
      }
    } catch (e) {
      errors.push({ file: rel(file), message: `<Tab>: ${(e as Error).message}` });
    }
  }

  for (const m of body.matchAll(REJILLA_SPEC)) {
    try {
      validateGrid(m[1]);
    } catch (e) {
      errors.push({ file: rel(file), message: (e as Error).message });
    }
  }

  for (const m of body.matchAll(MASTIL_TAG)) {
    const tag = m[0];
    const recorta = /\bdesde="/.test(tag) || /\bhasta="/.test(tag);
    const pieDeCaja = /\bpie="[^"]*[Cc]aja/.test(tag);
    // Con `notas` la ventana es legítima: son posiciones sueltas, no una
    // caja de escala, aunque el pie mencione la caja donde viven.
    const esCajaDeEscala = /\bescala="/.test(tag) && !/\bnotas="/.test(tag);
    if (recorta && pieDeCaja && esCajaDeEscala) {
      errors.push({
        file: rel(file),
        message:
          'una caja no es un rectángulo de trastes: usa `caja="N"` en vez de desde/hasta',
      });
    }
  }
}

function walkMdx(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkMdx(full);
    return entry.isFile() && entry.name.endsWith(".mdx") ? [full] : [];
  });
}

for (const file of walkMdx(CONTENT)) {
  const { body } = readMdx(file);
  checkMdxExpressions(file, body);
  checkMusicSpecs(file, body);
}

// avisos: semanas sin 5 días, wiki huérfana
for (const w of weeks) {
  if (w.dayCount < 5) {
    warnings.push({
      file: rel(w.file),
      message: `semana con ${w.dayCount}/5 días (${w.moduleSlug} ${w.fm.slug})`,
    });
  }
}
// cobertura del repertorio: una colección o una técnica sin canciones es un
// hueco del catálogo, no un error — el curso no puede pedir lo que no existe.
const songsByCollection = new Map<string, number>();
const songsByTechnique = new Map<string, number>();
const songsByLevel = new Map<number, number>();
for (const { fm } of songs) {
  songsByLevel.set(fm.level, (songsByLevel.get(fm.level) ?? 0) + 1);
  for (const c of fm.collections)
    songsByCollection.set(c, (songsByCollection.get(c) ?? 0) + 1);
  for (const t of fm.techniques)
    songsByTechnique.set(t, (songsByTechnique.get(t) ?? 0) + 1);
}
const emptyCollections = SONG_COLLECTIONS.filter((c) => !songsByCollection.has(c));
const emptyTechniques = SONG_TECHNIQUES.filter((t) => !songsByTechnique.has(t));
for (const c of emptyCollections) {
  warnings.push({ file: "content/songs", message: `colección sin canciones: "${c}"` });
}
for (const t of emptyTechniques) {
  warnings.push({ file: "content/songs", message: `técnica sin canciones: "${t}"` });
}

const orphanWikis = wikis.filter((w) => !wikiIncoming.has(w.fm.slug));
for (const w of orphanWikis) {
  warnings.push({ file: rel(w.file), message: `artículo wiki huérfano (sin backlinks)` });
}

// ---------- STATE.md ----------

const lines: string[] = [];
lines.push("# STATE.md — estado del contenido");
lines.push("");
lines.push("> Generado por `pnpm content:audit`. No editar a mano.");
lines.push("");
lines.push("## Inventario");
lines.push("");
lines.push(`| Tipo | Total |`);
lines.push(`|---|---|`);
lines.push(
  `| Módulos | ${modules.length} (${modules.filter((m) => m.fm.placeholder).length} placeholder) |`,
);
lines.push(`| Semanas | ${weeks.length} |`);
lines.push(`| Lecciones-día | ${lessons.length} |`);
lines.push(`| Ejercicios | ${exercises.length} |`);
lines.push(`| Canciones | ${songs.length} |`);
lines.push(`| Tabs | ${tabs.length} |`);
lines.push(`| Artículos wiki | ${wikis.length} |`);
lines.push(`| Quizzes | ${quizzes.length} |`);
lines.push("");

lines.push("## Módulos");
lines.push("");
for (const m of modules.sort((a, b) => a.fm.order - b.fm.order)) {
  const moduleWeeks = weeks.filter((w) => w.moduleSlug === m.fm.slug);
  const moduleLessons = lessons.filter((l) => l.moduleSlug === m.fm.slug);
  lines.push(
    `- **${m.fm.title}** (\`${m.fm.slug}\`)${m.fm.placeholder ? " _placeholder_" : ""}: ${moduleWeeks.length} semanas, ${moduleLessons.length} lecciones`,
  );
}
lines.push("");

if (brokenRefs.size > 0) {
  lines.push("## ❌ Referencias rotas (bloquean el build)");
  lines.push("");
  for (const [slug, files] of brokenRefs) {
    lines.push(`- \`${slug}\` referenciado desde: ${files.join(", ")}`);
  }
  lines.push("");
}

if (warnings.length > 0) {
  lines.push("## ⚠️ Avisos");
  lines.push("");
  for (const w of warnings) {
    lines.push(`- ${w.file}: ${w.message}`);
  }
  lines.push("");
}

lines.push("## Repertorio");
lines.push("");
lines.push("| Nivel | Canciones |");
lines.push("|---|---|");
for (const level of [1, 2, 3, 4, 5]) {
  lines.push(`| ${level} | ${songsByLevel.get(level) ?? 0} |`);
}
lines.push("");
lines.push("### Colecciones");
lines.push("");
for (const c of [...SONG_COLLECTIONS].sort(
  (a, b) => (songsByCollection.get(b) ?? 0) - (songsByCollection.get(a) ?? 0),
)) {
  lines.push(`- ${collectionLabel(c)} (\`${c}\`): ${songsByCollection.get(c) ?? 0}`);
}
lines.push("");
lines.push("### Técnicas sin repertorio");
lines.push("");
lines.push(
  emptyTechniques.length === 0
    ? "- Ninguna: todas las técnicas del vocabulario tienen al menos una canción."
    : emptyTechniques.map((t) => `- ${techniqueLabel(t)} (\`${t}\`)`).join("\n"),
);
lines.push("");

lines.push("## Cobertura wiki");
lines.push("");
const referenced = [...wikiIncoming.keys()];
const missingWiki = referenced.filter((s) => !wikiSlugs.has(s));
lines.push(`- Artículos existentes: ${wikis.length}`);
lines.push(
  `- Referenciados sin existir: ${missingWiki.length}${missingWiki.length ? ` → ${missingWiki.map((s) => `\`${s}\``).join(", ")}` : ""}`,
);
lines.push(
  `- Huérfanos (sin backlinks): ${orphanWikis.length}${orphanWikis.length ? ` → ${orphanWikis.map((w) => `\`${w.fm.slug}\``).join(", ")}` : ""}`,
);
lines.push("");

if (errors.length > 0) {
  lines.push("## ❌ Errores de validación");
  lines.push("");
  for (const e of errors) {
    lines.push(`- ${e.file}: ${e.message.split("\n")[0]}`);
  }
  lines.push("");
}

lines.push(`_Última ejecución: ${new Date().toISOString()}_`);
lines.push("");

fs.mkdirSync(CONTENT, { recursive: true });
fs.writeFileSync(path.join(CONTENT, "STATE.md"), lines.join("\n"));

// ---------- salida ----------

console.log(
  `content:audit — ${modules.length} módulos, ${lessons.length} lecciones, ${exercises.length} ejercicios, ${songs.length} canciones, ${wikis.length} wiki`,
);
if (warnings.length > 0) {
  console.log(`⚠️  ${warnings.length} avisos (ver content/STATE.md)`);
}
if (errors.length > 0) {
  console.error(`❌ ${errors.length} errores:`);
  for (const e of errors) console.error(`   ${e.file}: ${e.message.split("\n")[0]}`);
  process.exit(1);
}
console.log("✅ referencias íntegras");

// Evita "unused" para registros que hoy solo participan en índices.
void lessonSlugs;
