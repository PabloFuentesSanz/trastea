import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { resolveInterlinksWith } from "./interlinks";
import { terminosPorDia, type Termino } from "./jargon";
import { cache } from "react";
import { isTrainLevel, levelFromWeek, type TrainLevel } from "@/lib/train/taxonomy";
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
} from "./schemas";

const CONTENT_DIR = path.join(process.cwd(), "content");

function readMdx(filePath: string): { data: unknown; body: string } {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  return { data, body: content };
}

export interface LessonEntry {
  frontmatter: LessonFrontmatter;
  body: string;
  moduleSlug: string;
  weekDir: string;
  weekOrder: number;
}

export interface WeekEntry {
  frontmatter: WeekFrontmatter;
  /** la presentación de la semana: de qué va, por qué y qué sabrás al acabarla */
  body: string;
  moduleSlug: string;
  dir: string;
  lessons: LessonEntry[];
}

export interface ModuleEntry {
  frontmatter: ModuleFrontmatter;
  body: string;
  dir: string;
  weeks: WeekEntry[];
}

/** Carga el árbol completo del curso, ordenado. Cacheado por request. */
export const getCourse = cache((): ModuleEntry[] => {
  const courseDir = path.join(CONTENT_DIR, "course");
  if (!fs.existsSync(courseDir)) return [];

  const modules: ModuleEntry[] = [];
  for (const moduleDir of fs.readdirSync(courseDir)) {
    const modulePath = path.join(courseDir, moduleDir);
    const moduleFile = path.join(modulePath, "module.mdx");
    if (!fs.statSync(modulePath).isDirectory() || !fs.existsSync(moduleFile)) continue;

    const { data, body } = readMdx(moduleFile);
    const frontmatter = moduleFrontmatterSchema.parse(data);

    const weeks: WeekEntry[] = [];
    for (const weekDir of fs.readdirSync(modulePath)) {
      const weekPath = path.join(modulePath, weekDir);
      const weekFile = path.join(weekPath, "week.mdx");
      if (!fs.existsSync(weekFile)) continue;

      const weekMdx = readMdx(weekFile);
      const weekFm = weekFrontmatterSchema.parse(weekMdx.data);
      const lessons: LessonEntry[] = [];
      for (const file of fs.readdirSync(weekPath)) {
        if (!/^d\d\.mdx$/.test(file)) continue;
        const lesson = readMdx(path.join(weekPath, file));
        lessons.push({
          frontmatter: lessonFrontmatterSchema.parse(lesson.data),
          body: lesson.body,
          moduleSlug: frontmatter.slug,
          weekDir,
          weekOrder: weekFm.order,
        });
      }
      lessons.sort((a, b) => a.frontmatter.order - b.frontmatter.order);
      weeks.push({
        frontmatter: weekFm,
        body: weekMdx.body,
        moduleSlug: frontmatter.slug,
        dir: weekDir,
        lessons,
      });
    }
    weeks.sort((a, b) => a.frontmatter.order - b.frontmatter.order);
    modules.push({ frontmatter, body, dir: moduleDir, weeks });
  }
  modules.sort((a, b) => a.frontmatter.order - b.frontmatter.order);
  return modules;
});

export const getModule = cache((slug: string): ModuleEntry | null => {
  return getCourse().find((m) => m.frontmatter.slug === slug) ?? null;
});

/** Todas las lecciones en orden de curso (módulo → semana → día). */
export const getOrderedLessons = cache((): LessonEntry[] => {
  return getCourse().flatMap((m) => m.weeks.flatMap((w) => w.lessons));
});

/**
 * Las palabras que estrena cada lección. Se derivan del propio texto en el
 * orden del curso (ver jargon.ts), así que no hay nada que mantener a mano:
 * si una palabra se adelanta a otra semana, la lista se mueve sola.
 */
export const getTerminosNuevos = cache((slug: string): Termino[] => {
  const mapa = terminosPorDia(
    getOrderedLessons().map((l) => ({ id: l.frontmatter.slug, cuerpo: l.body })),
  );
  return mapa.get(slug) ?? [];
});

export const getLesson = cache((slug: string): LessonEntry | null => {
  return getOrderedLessons().find((l) => l.frontmatter.slug === slug) ?? null;
});

export function nextLessonSlug(current: string): string | null {
  const ordered = getOrderedLessons();
  const idx = ordered.findIndex((l) => l.frontmatter.slug === current);
  if (idx === -1 || idx === ordered.length - 1) return null;
  return ordered[idx + 1].frontmatter.slug;
}

export function prevLessonSlug(current: string): string | null {
  const ordered = getOrderedLessons();
  const idx = ordered.findIndex((l) => l.frontmatter.slug === current);
  if (idx <= 0) return null;
  return ordered[idx - 1].frontmatter.slug;
}

function loadFlatDir<T>(
  dir: string,
  parse: (data: unknown) => T,
): { frontmatter: T; body: string }[] {
  const fullDir = path.join(CONTENT_DIR, dir);
  if (!fs.existsSync(fullDir)) return [];
  return fs
    .readdirSync(fullDir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const { data, body } = readMdx(path.join(fullDir, f));
      return { frontmatter: parse(data), body };
    });
}

export const getExercises = cache(() =>
  loadFlatDir("exercises", (d): ExerciseFrontmatter =>
    exerciseFrontmatterSchema.parse(d),
  ),
);

export const getExercise = cache((slug: string) => {
  return getExercises().find((e) => e.frontmatter.slug === slug) ?? null;
});

export interface ExerciseUse {
  lessonSlug: string;
  lessonTitle: string;
  moduleSlug: string;
  week: number;
  day: number;
}

/**
 * Dónde usa el curso cada ejercicio. De aquí sale el nivel: el de la semana en
 * que aparece por primera vez. No se escribe en la ficha para que reordenar el
 * curso reordene los niveles solo.
 */
export const getExerciseUses = cache((): Map<string, ExerciseUse[]> => {
  const porEjercicio = new Map<string, ExerciseUse[]>();
  for (const modulo of getCourse()) {
    for (const semana of modulo.weeks) {
      // el `order` de la semana es su sitio dentro del módulo (1-4); el número
      // global del curso está en el directorio, que es w01…w12
      const week = Number(/w(\d+)/.exec(semana.dir)?.[1] ?? semana.frontmatter.order);
      for (const leccion of semana.lessons) {
        for (const block of leccion.frontmatter.blocks) {
          if (!block.exercise) continue;
          const lista = porEjercicio.get(block.exercise) ?? [];
          lista.push({
            lessonSlug: leccion.frontmatter.slug,
            lessonTitle: leccion.frontmatter.title,
            moduleSlug: modulo.frontmatter.slug,
            week,
            day: leccion.frontmatter.order,
          });
          porEjercicio.set(block.exercise, lista);
        }
      }
    }
  }
  return porEjercicio;
});

/** Nivel deducido: el de la primera semana que lo pide. */
/**
 * El nivel de un ejercicio: la semana del curso en que aparece por primera
 * vez. Los de práctica libre —los que no están en ninguna lección— lo
 * declaran en su frontmatter, porque no hay currículo del que deducirlo.
 */
export const getExerciseLevel = cache((slug: string): TrainLevel => {
  const usos = getExerciseUses().get(slug) ?? [];
  if (usos.length > 0) return levelFromWeek(Math.min(...usos.map((u) => u.week)));
  const declarado = getExercise(slug)?.frontmatter.level;
  return declarado && isTrainLevel(declarado) ? declarado : 3;
});

export const getSongs = cache(() =>
  loadFlatDir("songs", (d): SongFrontmatter => songFrontmatterSchema.parse(d)),
);

export const getSong = cache((slug: string) => {
  return getSongs().find((s) => s.frontmatter.slug === slug) ?? null;
});

export const getWikiArticles = cache(() =>
  loadFlatDir("wiki", (d): WikiFrontmatter => wikiFrontmatterSchema.parse(d)),
);

export const getWikiArticle = cache((slug: string) => {
  return getWikiArticles().find((w) => w.frontmatter.slug === slug) ?? null;
});

export const getQuizzes = cache(() =>
  loadFlatDir("quizzes", (d): QuizFrontmatter => quizFrontmatterSchema.parse(d)),
);

export const getQuiz = cache((slug: string) => {
  return getQuizzes().find((q) => q.frontmatter.slug === slug) ?? null;
});

export interface WikiBacklink {
  kind: "lesson" | "wiki" | "song" | "exercise";
  slug: string;
  title: string;
}

/** "Este artículo aparece en…" — calculado leyendo el grafo de contenido. */
export const getWikiBacklinks = cache((wikiSlug: string): WikiBacklink[] => {
  const links: WikiBacklink[] = [];
  for (const lesson of getOrderedLessons()) {
    if (lesson.frontmatter.wiki_refs.includes(wikiSlug)) {
      links.push({
        kind: "lesson",
        slug: lesson.frontmatter.slug,
        title: lesson.frontmatter.title,
      });
    }
  }
  for (const article of getWikiArticles()) {
    const mentions =
      article.frontmatter.related.includes(wikiSlug) ||
      new RegExp(`\\[\\[${wikiSlug}(\\||\\]\\])`).test(article.body);
    if (mentions && article.frontmatter.slug !== wikiSlug) {
      links.push({
        kind: "wiki",
        slug: article.frontmatter.slug,
        title: article.frontmatter.title,
      });
    }
  }
  for (const song of getSongs()) {
    if (song.frontmatter.wiki_refs.includes(wikiSlug)) {
      links.push({
        kind: "song",
        slug: song.frontmatter.slug,
        title: song.frontmatter.title,
      });
    }
  }
  return links;
});

/** Lecciones que usan una canción (para "aparece en…"). */
export const getSongLessons = cache((songSlug: string): LessonEntry[] => {
  return getOrderedLessons().filter((lesson) =>
    lesson.frontmatter.blocks.some((block) => block.song === songSlug),
  );
});

/** Convierte [[interlinks]] de la wiki en enlaces markdown antes de renderizar. */
export function resolveInterlinks(body: string): string {
  return resolveInterlinksWith(
    body,
    (slug) => getWikiArticle(slug)?.frontmatter.title ?? null,
  );
}
