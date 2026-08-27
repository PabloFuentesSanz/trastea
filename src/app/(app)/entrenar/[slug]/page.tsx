import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Brain, Clock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrainSession, type TrainChoices } from "@/components/train/train-session";
import { getTrainingDeck, getUserContext } from "@/lib/queries";
import { DRILLS, drillLevel, getDrill } from "@/lib/train/catalog";
import type { TrainCard } from "@/lib/train/cards";
import { scaleBoxPositions } from "@/lib/train/scales";
import {
  isTrainLevel,
  TRAIN_LEVEL_LABEL,
  TRAIN_MODE_LABEL,
  TRAIN_SKILL_LABEL,
  TRAIN_THEME_LABEL,
} from "@/lib/train/taxonomy";

/** El mazo depende del progreso y del reloj. */
export const dynamic = "force-dynamic";

/** Tamaño de sesión: unos cinco minutos con la guitarra en la mano. */
const SESSION_SIZE = 20;

/**
 * Cuántos trastes hay que dibujar para que quepa todo lo que se pregunta.
 * Las cajas altas de una escala se van al traste 17: con doce, la caja 5 de
 * la pentatónica se sale del dibujo y la pregunta no tiene respuesta posible.
 */
function fretsNeeded(cards: readonly TrainCard[]): number {
  let max = 12;
  for (const card of cards) {
    switch (card.type) {
      case "fretboard_note":
        max = Math.max(max, card.fret);
        break;
      case "interval_name":
        max = Math.max(max, card.from.fret, card.to.fret);
        break;
      case "interval_build":
        max = Math.max(max, card.from.fret);
        break;
      case "scale_degree":
        max = Math.max(max, card.position.fret);
        break;
      case "scale_box":
        max = Math.max(
          max,
          ...scaleBoxPositions(card.root, card.scaleId, card.box).map((p) => p.fret),
        );
        break;
      default:
        break;
    }
  }
  // un traste de aire a la derecha: pegado al borde no se lee
  return Math.min(22, max + 1);
}

export function generateStaticParams() {
  return DRILLS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const drill = getDrill(slug);
  return { title: drill ? drill.title : "Entrenar" };
}

/**
 * Qué respuestas se ofrecen. En los de oído, solo las que de verdad pueden
 * salir en ese nivel: ofrecer las trece cuando el nivel 1 solo tiene tres
 * convertiría un ejercicio de dos opciones en uno de trece.
 */
function choicesFor(cards: readonly TrainCard[]): TrainChoices {
  const intervals = new Set<number>();
  const chords = new Set<string>();
  for (const card of cards) {
    if (card.type === "ear_interval") intervals.add(card.semitones);
    if (card.type === "ear_chord") chords.add(card.chordId);
  }
  return {
    // en interval_name la respuesta se deduce del mástil, así que ahí se
    // ofrecen las trece de la octava
    intervals:
      intervals.size > 0
        ? [...intervals].sort((a, b) => a - b)
        : Array.from({ length: 13 }, (_, i) => i),
    chords: [...chords],
  };
}

export default async function DrillPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const drill = getDrill(slug);
  if (!drill) notFound();

  const sp = await searchParams;
  const rawLevel = Number(typeof sp.nivel === "string" ? sp.nivel : "");
  const pedido = isTrainLevel(rawLevel) ? rawLevel : drill.levels[0].level;
  const level = drillLevel(drill, pedido);

  const cards = level.build();
  const ctx = await getUserContext();
  const deck = await getTrainingDeck(ctx.userId, cards, SESSION_SIZE);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link
        href="/entrenar"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden /> Entrenar
      </Link>

      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{drill.title}</h1>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge variant="outline">{TRAIN_THEME_LABEL[drill.theme]}</Badge>
        <Badge variant="outline">{TRAIN_MODE_LABEL[drill.mode]}</Badge>
        {drill.skills.map((s) => (
          <Badge key={s} variant="secondary" className="font-normal">
            {TRAIN_SKILL_LABEL[s]}
          </Badge>
        ))}
      </div>
      <p className="text-muted-foreground mt-3">{drill.summary}</p>

      <section aria-label="Nivel" className="mt-6">
        <h2 className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
          Nivel
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {drill.levels.map((l) => (
            <Link
              key={l.level}
              href={`/entrenar/${drill.slug}?nivel=${l.level}`}
              aria-current={l.level === level.level ? "true" : undefined}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm transition-colors",
                l.level === level.level
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <span className="font-medium">
                {l.level} · {TRAIN_LEVEL_LABEL[l.level]}
              </span>
              <span
                className={cn(
                  "block text-xs",
                  l.level === level.level
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground",
                )}
              >
                {l.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat icon={Clock} label="Tocan hoy" value={deck.due} />
        <Stat icon={Sparkles} label="Sin estrenar" value={deck.fresh} />
        <Stat icon={Brain} label="Consolidadas" value={deck.learned} total={deck.total} />
      </div>

      {!ctx.userId && (
        <p className="border-primary/30 bg-primary/10 text-primary mt-4 rounded-lg border px-3 py-2 text-xs">
          Sin sesión iniciada puedes entrenar, pero el sistema no recordará qué te cuesta.
        </p>
      )}

      <TrainSession
        key={`${drill.slug}-${level.level}`}
        cards={deck.session}
        choices={choicesFor(cards)}
        demo={!ctx.userId}
        frets={fretsNeeded(deck.session)}
      />
    </main>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  total,
}: {
  icon: typeof Clock;
  label: string;
  value: number;
  total?: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-1.5">
          <Icon className="text-primary size-4" aria-hidden /> {label}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="display-number text-3xl">
          {value}
          {total !== undefined && (
            <span className="text-muted-foreground text-lg">/{total}</span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
