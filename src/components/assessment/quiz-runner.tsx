"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { submitQuiz } from "@/app/actions/assessment";
import { isQuizComplete, type QuizAnswers } from "@/lib/assessment/scoring";

/** Pregunta sin la respuesta: la corrección ocurre en servidor. */
export interface PublicQuestion {
  q: string;
  options: string[];
}

export function QuizRunner({
  moduleSlug,
  questions,
  passScore,
  alreadyPassed,
}: {
  moduleSlug: string;
  questions: PublicQuestion[];
  passScore: number;
  alreadyPassed: boolean;
}) {
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [pending, startTransition] = useTransition();

  const complete = useMemo(
    () => isQuizComplete(questions, answers),
    [questions, answers],
  );
  const answeredCount = Object.keys(answers).length;

  const send = () => {
    startTransition(async () => {
      const res = await submitQuiz({ moduleSlug, answers });
      if (!res.ok && res.error !== "demo") {
        toast.error(`No se pudo guardar: ${res.error}`);
      }
      if (res.score !== undefined && res.passed !== undefined) {
        setResult({ score: res.score, passed: res.passed });
        if (res.error === "demo") {
          toast.message("Modo demo: el resultado no se guarda.");
        }
      }
    });
  };

  if (result) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center">
        <p
          className={cn(
            "display-number text-6xl",
            result.passed ? "text-success" : "text-destructive",
          )}
        >
          {Math.round(result.score * 100)}%
        </p>
        <p className="mt-2 flex items-center justify-center gap-2 text-lg">
          {result.passed ? (
            <>
              <Check className="size-5 text-success" aria-hidden /> Superado
            </>
          ) : (
            <>
              <X className="size-5 text-destructive" aria-hidden /> Necesitas un{" "}
              {Math.round(passScore * 100)}%
            </>
          )}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {result.passed
            ? "La teoría está donde tiene que estar. A por las otras dos patas de la evaluación."
            : "Repasa la wiki del módulo y vuelve: no hay límite de intentos."}
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => {
            setAnswers({});
            setResult(null);
          }}
        >
          <RotateCcw aria-hidden /> Repetir el quiz
        </Button>
      </div>
    );
  }

  return (
    <div>
      {alreadyPassed && (
        <p className="mb-4 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
          Ya superaste este quiz. Puedes repetirlo cuando quieras.
        </p>
      )}

      <div className="flex items-center gap-3">
        <Progress
          value={(answeredCount / questions.length) * 100}
          className="h-2"
          aria-label={`${answeredCount} de ${questions.length} respondidas`}
        />
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {answeredCount}/{questions.length}
        </span>
      </div>

      <ol className="mt-6 flex flex-col gap-6">
        {questions.map((question, index) => (
          <li key={question.q} className="rounded-xl border bg-card p-4">
            <p className="font-medium">
              <span className="text-muted-foreground">{index + 1}.</span> {question.q}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {question.options.map((option, optionIndex) => {
                const selected = answers[index] === optionIndex;
                return (
                  <Button
                    key={option}
                    variant="outline"
                    aria-pressed={selected}
                    className={cn(
                      "h-auto justify-start whitespace-normal py-2.5 text-left",
                      selected && "border-primary bg-accent",
                    )}
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [index]: optionIndex }))
                    }
                  >
                    {option}
                  </Button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-col items-center gap-2">
        <Button size="lg" disabled={!complete || pending} onClick={send}>
          {pending ? "Corrigiendo…" : "Corregir quiz"}
        </Button>
        {!complete && (
          <p className="text-xs text-muted-foreground">
            Responde las {questions.length} preguntas para corregir.
          </p>
        )}
      </div>
    </div>
  );
}
