import type { Metadata } from "next";
import Link from "next/link";
import { AudioLines, Ear, Grid3x3, Guitar, Music, Ruler, Timer, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DRILLS, filterDrills, type Drill } from "@/lib/train/catalog";
import { getExerciseLevel, getExercises } from "@/lib/content/loader";
import {
  isTrainLevel,
  isTrainMode,
  isTrainSkill,
  isTrainTheme,
  TRAIN_LEVELS,
  TRAIN_LEVEL_LABEL,
  TRAIN_MODES,
  TRAIN_MODE_HINT,
  TRAIN_MODE_LABEL,
  TRAIN_SKILL_LABEL,
  TRAIN_THEMES,
  TRAIN_THEME_LABEL,
  type TrainLevel,
  type TrainMode,
  type TrainSkill,
  type TrainTheme,
} from "@/lib/train/taxonomy";

export const metadata: Metadata = { title: "Entrenar" };

const THEME_ICON: Record<TrainTheme, LucideIcon> = {
  diapason: Guitar,
  intervalos: Ruler,
  acordes: Grid3x3,
  escalas: AudioLines,
  oido: Ear,
  tecnica: Zap,
  ritmo: Timer,
  aplicacion: Music,
};

interface Filtros {
  theme?: TrainTheme;
  skill?: TrainSkill;
  mode?: TrainMode;
  level?: TrainLevel;
}

/** Enlace a la misma página cambiando (o quitando) un filtro. */
function href(actuales: Filtros, cambio: Partial<Filtros>): string {
  const siguiente = { ...actuales, ...cambio };
  const params = new URLSearchParams();
  if (siguiente.theme) params.set("tema", siguiente.theme);
  if (siguiente.skill) params.set("destreza", siguiente.skill);
  if (siguiente.mode) params.set("modo", siguiente.mode);
  if (siguiente.level) params.set("nivel", String(siguiente.level));
  const query = params.toString();
  return query ? `/entrenar?${query}` : "/entrenar";
}

function Chip({
  active,
  children,
  ...props
}: React.ComponentProps<typeof Link> & { active: boolean }) {
  return (
    <Link
      {...props}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {children}
    </Link>
  );
}

function DrillCard({ drill }: { drill: Drill & { href?: string } }) {
  const Icon = THEME_ICON[drill.theme];
  const niveles = drill.levels.map((l) => l.level);
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardDescription className="flex items-center gap-1.5">
          <Icon className="size-4 text-primary" aria-hidden />
          {TRAIN_THEME_LABEL[drill.theme]} · {TRAIN_MODE_LABEL[drill.mode]}
        </CardDescription>
        <CardTitle>
          <Link
            href={drill.href ?? `/entrenar/${drill.slug}`}
            className="hover:underline"
          >
            {drill.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-4">
        <p className="text-muted-foreground text-sm">{drill.summary}</p>
        <div className="flex flex-wrap gap-1.5">
          {drill.skills.map((s) => (
            <Badge key={s} variant="secondary" className="font-normal">
              {TRAIN_SKILL_LABEL[s]}
            </Badge>
          ))}
          <Badge variant="outline" className="font-normal">
            Niveles {Math.min(...niveles)}-{Math.max(...niveles)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Los ejercicios del curso, vistos como entrenamientos. No están en el
 * catálogo de código porque son contenido: los escribe una persona. Aquí se
 * les da la misma forma para que salgan en los mismos filtros.
 */
function exerciseDrills(): Drill[] {
  return getExercises()
    .map(({ frontmatter }) => {
      const level = getExerciseLevel(frontmatter.slug);
      const skills = frontmatter.trains.filter(isTrainSkill);
      const cronometrable = frontmatter.bpm_target !== undefined;
      return {
        slug: frontmatter.slug,
        title: frontmatter.title,
        summary: cronometrable
          ? `Con metrónomo y cronómetro, de ${frontmatter.bpm_start ?? 60} a ${frontmatter.bpm_target} bpm. Cada intento queda registrado.`
          : "Ejercicio del curso: se hace escuchando o cantando, sin tempo que perseguir.",
        theme: THEME_BY_CATEGORY[frontmatter.category],
        skills,
        mode: cronometrable ? ("cronometrado" as const) : ("guiado" as const),
        levels: [{ level, label: TRAIN_LEVEL_LABEL[level], build: () => [] }],
        href: `/ejercicios/${frontmatter.slug}`,
      };
    })
    .sort((a, b) => a.levels[0].level - b.levels[0].level);
}

/** La categoría del ejercicio, traducida al tema del centro de entrenamiento. */
const THEME_BY_CATEGORY: Record<string, TrainTheme> = {
  tecnica: "tecnica",
  diapason: "diapason",
  oido: "oido",
  aplicacion: "aplicacion",
  repertorio: "aplicacion",
  teoria: "aplicacion",
};

export default async function EntrenarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const get = (key: string) =>
    typeof params[key] === "string" ? params[key] : undefined;

  const rawTheme = get("tema");
  const rawSkill = get("destreza");
  const rawMode = get("modo");
  const rawLevel = Number(get("nivel"));

  const filtros: Filtros = {
    theme: rawTheme && isTrainTheme(rawTheme) ? rawTheme : undefined,
    skill: rawSkill && isTrainSkill(rawSkill) ? rawSkill : undefined,
    mode: rawMode && isTrainMode(rawMode) ? rawMode : undefined,
    level: isTrainLevel(rawLevel) ? rawLevel : undefined,
  };

  const todos = [...DRILLS, ...exerciseDrills()];
  const resultados = filterDrills(todos, filtros) as (Drill & { href?: string })[];

  // solo se ofrecen los temas y destrezas que existen de verdad en el catálogo
  const temasConDrills = TRAIN_THEMES.filter((t) => todos.some((d) => d.theme === t));
  const destrezas = [...new Set(todos.flatMap((d) => d.skills))].sort((a, b) =>
    TRAIN_SKILL_LABEL[a].localeCompare(TRAIN_SKILL_LABEL[b], "es"),
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Entrenar</h1>
      <p className="text-muted-foreground mt-1">
        Todo lo que se puede practicar sin partitura: el mástil, los intervalos, los
        acordes y el oído. Elige por lo que quieras mejorar y por el nivel al que estés.
      </p>

      <div className="mt-6 space-y-4">
        <Filtro titulo="Tema">
          <Chip active={!filtros.theme} href={href(filtros, { theme: undefined })}>
            Todos
          </Chip>
          {temasConDrills.map((t) => (
            <Chip
              key={t}
              active={filtros.theme === t}
              href={href(filtros, { theme: filtros.theme === t ? undefined : t })}
            >
              {TRAIN_THEME_LABEL[t]}
            </Chip>
          ))}
        </Filtro>

        <Filtro titulo="Nivel">
          <Chip active={!filtros.level} href={href(filtros, { level: undefined })}>
            Cualquiera
          </Chip>
          {TRAIN_LEVELS.map((n) => (
            <Chip
              key={n}
              active={filtros.level === n}
              href={href(filtros, { level: filtros.level === n ? undefined : n })}
            >
              {n} · {TRAIN_LEVEL_LABEL[n]}
            </Chip>
          ))}
        </Filtro>

        <Filtro titulo="Cómo se practica">
          <Chip active={!filtros.mode} href={href(filtros, { mode: undefined })}>
            Todo
          </Chip>
          {TRAIN_MODES.filter((m) => todos.some((d) => d.mode === m)).map((m) => (
            <Chip
              key={m}
              active={filtros.mode === m}
              href={href(filtros, { mode: filtros.mode === m ? undefined : m })}
              title={TRAIN_MODE_HINT[m]}
            >
              {TRAIN_MODE_LABEL[m]}
            </Chip>
          ))}
        </Filtro>

        <Filtro titulo="Qué quiero mejorar">
          <Chip active={!filtros.skill} href={href(filtros, { skill: undefined })}>
            Lo que sea
          </Chip>
          {destrezas.map((s) => (
            <Chip
              key={s}
              active={filtros.skill === s}
              href={href(filtros, { skill: filtros.skill === s ? undefined : s })}
            >
              {TRAIN_SKILL_LABEL[s]}
            </Chip>
          ))}
        </Filtro>
      </div>

      <p className="text-muted-foreground mt-6 text-sm" aria-live="polite">
        {resultados.length === 0
          ? "Nada con esa combinación. Quita algún filtro."
          : `${resultados.length} ${resultados.length === 1 ? "entrenamiento" : "entrenamientos"}`}
      </p>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {resultados.map((drill) => (
          <DrillCard key={drill.slug} drill={drill} />
        ))}
      </div>
    </main>
  );
}

function Filtro({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section aria-label={titulo}>
      <h2 className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
        {titulo}
      </h2>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </section>
  );
}
