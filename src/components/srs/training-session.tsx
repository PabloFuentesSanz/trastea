"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { gradeCard } from "@/app/actions/srs";
import {
  ANSWER_OPTIONS,
  answerFor,
  cardId,
  guitarStringNumber,
  isCorrect,
  type FretboardNoteCard,
} from "@/lib/srs/deck";
import type { Grade } from "@/lib/srs/scheduler";
import { QuizFretboard, type QuizMark } from "./quiz-fretboard";

interface Answered {
  card: FretboardNoteCard;
  correct: boolean;
  ms: number;
}

/** Un acierto rápido vale más que uno dudado: eso es lo que gradúa la tarjeta. */
const FAST_MS = 3000;

export function TrainingSession({
  cards,
  demo,
}: {
  cards: FretboardNoteCard[];
  demo: boolean;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [mark, setMark] = useState<QuizMark>("none");
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [answers, setAnswers] = useState<Answered[]>([]);
  const [, startTransition] = useTransition();

  const card = cards[index];
  const finished = index >= cards.length;
  const answer = useMemo(() => (card ? answerFor(card) : null), [card]);

  const submit = useCallback(
    (pc: number) => {
      if (!card || mark !== "none") return;
      const ms = Date.now() - startedAt;
      const correct = isCorrect(card, pc);
      setMark(correct ? "correct" : "wrong");
      setAnswers((prev) => [...prev, { card, correct, ms }]);

      const grade: Grade = !correct ? "again" : ms <= FAST_MS ? "good" : "hard";
      if (!demo) {
        startTransition(async () => {
          await gradeCard({ cardId: cardId(card), grade });
        });
      }

      window.setTimeout(
        () => {
          setIndex((i) => i + 1);
          setMark("none");
          setStartedAt(Date.now());
        },
        correct ? 550 : 1400,
      );
    },
    [card, mark, startedAt, demo],
  );

  // Atajos: teclas 1-9/0 y letras para responder rápido sin ratón
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (mark !== "none" || !card) return;
      const letter = e.key.toUpperCase();
      const match = ANSWER_OPTIONS.find((o) => o.label === letter);
      if (match) submit(match.pc);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [card, mark, submit]);

  if (finished) {
    const hits = answers.filter((a) => a.correct).length;
    const avgMs =
      answers.length > 0
        ? Math.round(answers.reduce((sum, a) => sum + a.ms, 0) / answers.length)
        : 0;
    const wrong = answers.filter((a) => !a.correct);

    return (
      <section aria-label="Resumen de la sesión" className="mt-8 text-center">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          Sesión terminada
        </p>
        <p className="display-number mt-2 text-7xl">
          {hits}
          <span className="text-3xl text-muted-foreground">/{answers.length}</span>
        </p>
        <p className="mt-2 text-muted-foreground">
          {(avgMs / 1000).toFixed(1)}s de media por nota
          {avgMs <= FAST_MS ? " — ese es el ritmo." : " — busca bajar de 3s."}
        </p>

        {wrong.length > 0 && (
          <div className="mx-auto mt-6 max-w-sm rounded-lg border p-4 text-left">
            <p className="text-sm font-medium">Para repasar:</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {wrong.map(({ card: c }) => (
                <li key={cardId(c)}>
                  Cuerda {guitarStringNumber(c.string)}, traste {c.fret} →{" "}
                  <strong className="text-foreground">{answerFor(c).sharp}</strong>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Volverán a salir pronto: el sistema las repite hasta que dejen de costarte.
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button
            size="lg"
            onClick={() => {
              router.refresh();
              setIndex(0);
              setAnswers([]);
              setStartedAt(Date.now());
            }}
          >
            <RotateCcw aria-hidden /> Otra ronda
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/hoy">Ir a la lección de hoy</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Entrenamiento" className="mt-6">
      <div className="flex items-center gap-3">
        <Progress
          value={(index / cards.length) * 100}
          className="h-2"
          aria-label={`Nota ${index + 1} de ${cards.length}`}
        />
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {index + 1}/{cards.length}
        </span>
      </div>

      <p className="mt-6 text-center text-lg">
        ¿Qué nota es la{" "}
        <strong className="text-primary">
          cuerda {guitarStringNumber(card.string)}, traste {card.fret}
        </strong>
        ?
      </p>

      <div className="mt-4 overflow-x-auto rounded-xl border bg-card p-3">
        <QuizFretboard
          card={card}
          mark={mark}
          answerLabel={mark === "none" ? undefined : (answer?.sharp ?? "")}
        />
      </div>

      <div
        className="mx-auto mt-6 grid max-w-2xl grid-cols-4 gap-2 sm:grid-cols-6"
        role="group"
        aria-label="Elige la nota"
      >
        {ANSWER_OPTIONS.map((option) => {
          const isAnswer = answer?.pc === option.pc;
          const showAsCorrect = mark !== "none" && isAnswer;
          return (
            <Button
              key={option.pc}
              variant="outline"
              className={cn(
                "h-14 text-lg font-semibold",
                showAsCorrect && "border-success bg-success/20 text-success",
                mark === "wrong" && !isAnswer && "opacity-40",
              )}
              disabled={mark !== "none"}
              onClick={() => submit(option.pc)}
            >
              {option.label}
            </Button>
          );
        })}
      </div>

      <p
        aria-live="polite"
        className={cn(
          "mt-4 flex items-center justify-center gap-2 text-sm",
          mark === "correct" && "text-success",
          mark === "wrong" && "text-destructive",
          mark === "none" && "text-muted-foreground",
        )}
      >
        {mark === "correct" && (
          <>
            <Check className="size-4" aria-hidden /> ¡Esa es!
          </>
        )}
        {mark === "wrong" && (
          <>
            <X className="size-4" aria-hidden /> Era {answer?.sharp}
            {answer && answer.sharp !== answer.flat && ` (o ${answer.flat})`}
          </>
        )}
        {mark === "none" && "Puedes responder con el teclado: pulsa la letra de la nota."}
      </p>
    </section>
  );
}
