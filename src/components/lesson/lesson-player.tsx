"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Maximize2, Target, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { completeBlock, completeLesson } from "@/app/actions/practice";
import type { LessonBlock, LessonFrontmatter } from "@/lib/content/schemas";
import { LessonPlayerContext, type LessonPlayerState } from "./lesson-context";
import { BlockTimer } from "./block-timer";
import { EmbeddedMetronome, metronomeConfigForBlock } from "./embedded-metronome";
import { BLOCK_TYPE_LABEL } from "./lesson-block-card";

function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function LessonPlayer({
  lesson,
  initialDoneBlocks,
  alreadyCompleted,
  demo,
  breadcrumb,
  nextHref,
  children,
}: {
  lesson: LessonFrontmatter;
  initialDoneBlocks: string[];
  alreadyCompleted: boolean;
  demo: boolean;
  breadcrumb: string;
  nextHref: string | null;
  children: ReactNode;
}) {
  const router = useRouter();
  const [doneBlocks, setDoneBlocks] = useState<ReadonlySet<string>>(
    () => new Set(initialDoneBlocks),
  );
  const [bpmByBlock, setBpmByBlock] = useState<Record<string, number>>({});
  const [completed, setCompleted] = useState(alreadyCompleted);
  const [focus, setFocus] = useState(false);
  const [pending, startTransition] = useTransition();

  const state = useMemo<LessonPlayerState>(
    () => ({
      doneBlocks,
      bpmByBlock,
      completed,
      demo,
      markBlockDone: (blockId, bpm) => {
        setDoneBlocks((prev) => new Set([...prev, blockId]));
        if (bpm !== undefined) setBpmByBlock((prev) => ({ ...prev, [blockId]: bpm }));
      },
      setBpm: (blockId, bpm) =>
        setBpmByBlock((prev) => ({ ...prev, [blockId]: bpm })),
    }),
    [doneBlocks, bpmByBlock, completed, demo],
  );

  const total = lesson.blocks.length;
  const doneCount = lesson.blocks.filter((b) => doneBlocks.has(b.id)).length;
  const currentBlock: LessonBlock | null =
    lesson.blocks.find((b) => !doneBlocks.has(b.id)) ?? null;

  const finishLesson = () => {
    startTransition(async () => {
      const blocks = lesson.blocks
        .filter((b) => doneBlocks.has(b.id))
        .map((b) => ({
          id: b.id,
          type: b.type,
          min: b.min,
          bpm: bpmByBlock[b.id],
        }));
      const result = await completeLesson({
        lessonSlug: lesson.slug,
        date: todayLocal(),
        durationMin: blocks.reduce((sum, b) => sum + b.min, 0),
        blocks,
      });
      if (!result.ok && result.error !== "demo") {
        toast.error(`No se pudo guardar la sesión: ${result.error}`);
        return;
      }
      setCompleted(true);
      setFocus(false);
      toast.success(
        result.ok
          ? "Sesión guardada. 🔥 La racha sigue."
          : "Lección completada (modo demo: no se guarda)",
      );
      router.refresh();
    });
  };

  return (
    <LessonPlayerContext.Provider value={state}>
      {/* Cabecera pegajosa con progreso */}
      <div className="sticky top-0 z-30 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur md:top-14">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs text-muted-foreground">{breadcrumb}</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <h1 className="truncate text-lg font-semibold">{lesson.title}</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFocus(true)}
              aria-label="Modo focus a pantalla completa"
            >
              <Maximize2 aria-hidden /> Focus
            </Button>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <Progress
              value={(doneCount / total) * 100}
              aria-label={`${doneCount} de ${total} bloques completados`}
              className="h-2"
            />
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {doneCount}/{total}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl">
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-primary/30 bg-accent/40 p-3 text-sm">
          <Target className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span>
            <strong>Objetivo de hoy:</strong> {lesson.goal}
          </span>
        </p>

        <div className="mt-4 flex flex-col gap-3">{children}</div>

        <div className="mt-6 flex flex-col items-center gap-3 pb-10">
          {completed ? (
            <>
              <p className="flex items-center gap-2 text-success">
                <Check aria-hidden /> Lección completada
              </p>
              {nextHref && (
                <Button asChild size="lg">
                  <Link href={nextHref}>
                    Siguiente lección <ArrowRight aria-hidden />
                  </Link>
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                size="lg"
                className="h-12 min-w-56 text-base"
                onClick={finishLesson}
                disabled={pending || doneCount === 0}
              >
                <Check aria-hidden />
                Completar lección
              </Button>
              {doneCount === 0 && (
                <p className="text-xs text-muted-foreground">
                  Completa al menos un bloque para cerrar la sesión.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modo focus */}
      {focus && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Modo focus"
          className="fixed inset-0 z-50 flex flex-col bg-background"
        >
          <div className="flex items-center justify-between p-4">
            <span className="text-sm text-muted-foreground">
              {doneCount}/{total} bloques · {lesson.title}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFocus(false)}
              aria-label="Salir del modo focus"
            >
              <X aria-hidden />
            </Button>
          </div>
          {currentBlock ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto p-6 text-center">
              <p className="text-sm uppercase tracking-widest text-muted-foreground">
                {BLOCK_TYPE_LABEL[currentBlock.type]}
              </p>
              <h2 className="max-w-xl text-2xl font-semibold">
                {currentBlock.title ?? currentBlock.exercise ?? currentBlock.song}
              </h2>
              <BlockTimer minutes={currentBlock.min} large />
              {(() => {
                const config = metronomeConfigForBlock(currentBlock);
                return config ? (
                  <div className="w-full max-w-md">
                    <EmbeddedMetronome initial={config} />
                  </div>
                ) : null;
              })()}
              <Button
                size="lg"
                onClick={() => {
                  state.markBlockDone(currentBlock.id);
                  startTransition(async () => {
                    await completeBlock({
                      lessonSlug: lesson.slug,
                      blockId: currentBlock.id,
                    });
                  });
                }}
                className="h-12"
              >
                <Check aria-hidden /> Bloque hecho, siguiente
              </Button>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4">
              <p className="text-xl">Todos los bloques hechos 🎉</p>
              <Button size="lg" onClick={finishLesson} disabled={pending || completed}>
                <Check aria-hidden /> Completar lección
              </Button>
            </div>
          )}
        </div>
      )}
    </LessonPlayerContext.Provider>
  );
}
