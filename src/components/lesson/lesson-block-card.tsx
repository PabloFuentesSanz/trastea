"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { Check, ChevronDown, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { completeBlock, logBpm } from "@/app/actions/practice";
import type { LessonBlock } from "@/lib/content/schemas";
import { useLessonPlayer } from "./lesson-context";
import { BlockTimer } from "./block-timer";
import { EmbeddedMetronome, metronomeConfigForBlock } from "./embedded-metronome";

export const BLOCK_TYPE_LABEL: Record<LessonBlock["type"], string> = {
  tecnica: "Técnica",
  diapason: "Diapasón",
  oido: "Oído y ritmo",
  aplicacion: "Aplicación",
  repertorio: "Repertorio",
  teoria: "Teoría",
};

export function LessonBlockCard({
  lessonSlug,
  block,
  resolvedTitle,
  children,
}: {
  lessonSlug: string;
  block: LessonBlock;
  /** título del ejercicio/canción resuelto en servidor */
  resolvedTitle: string | null;
  children?: ReactNode;
}) {
  const player = useLessonPlayer();
  const done = player.doneBlocks.has(block.id);
  const [open, setOpen] = useState(false);
  const [bpmValue, setBpmValue] = useState<string>(String(block.bpm_start ?? ""));
  const [, startTransition] = useTransition();

  const metronomeConfig = metronomeConfigForBlock(block);
  const contentId = `block-content-${block.id}`;

  const handleComplete = () => {
    const bpm = block.log_bpm ? Number(bpmValue) : undefined;
    if (block.log_bpm && bpm && block.exercise) {
      startTransition(async () => {
        const result = await logBpm({
          exerciseSlug: block.exercise!,
          bpm,
          clean: true,
        });
        if (!result.ok && result.error !== "demo") {
          toast.error(`No se pudo guardar el bpm: ${result.error}`);
        }
      });
    }
    player.markBlockDone(block.id, bpm && Number.isFinite(bpm) ? bpm : undefined);
    startTransition(async () => {
      const result = await completeBlock({ lessonSlug, blockId: block.id });
      if (!result.ok && result.error !== "demo") {
        toast.error(`No se pudo guardar el bloque: ${result.error}`);
      }
    });
    setOpen(false);
  };

  return (
    <section
      aria-label={`Bloque ${BLOCK_TYPE_LABEL[block.type]}`}
      className={cn(
        "rounded-xl border bg-card transition-colors",
        done && "border-success/50 bg-success/5",
      )}
    >
      <div className="flex flex-wrap items-center gap-3 p-4">
        <span
          aria-hidden
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm",
            done ? "border-success bg-success text-success-foreground" : "border-border",
          )}
        >
          {done ? <Check className="size-4" /> : block.id.replace("b", "")}
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("truncate font-medium", done && "line-through opacity-70")}>
            {block.title ?? resolvedTitle ?? BLOCK_TYPE_LABEL[block.type]}
          </p>
          <p className="text-xs text-muted-foreground">
            {BLOCK_TYPE_LABEL[block.type]} · {block.min} min
            {block.bpm_start ? ` · desde ${block.bpm_start} bpm` : ""}
          </p>
        </div>
        <Badge variant="outline">{block.min}&#8217;</Badge>
        <Button
          variant="ghost"
          size="icon"
          aria-expanded={open}
          aria-controls={contentId}
          aria-label={open ? "Cerrar bloque" : "Abrir bloque"}
          onClick={() => setOpen((o) => !o)}
        >
          <ChevronDown
            aria-hidden
            className={cn("transition-transform", open && "rotate-180")}
          />
        </Button>
      </div>

      {open && (
        <div id={contentId} className="border-t px-4 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <BlockTimer minutes={block.min} />
            {block.tool && !block.tool.startsWith("/metronomo") && (
              <Button asChild variant="outline" size="sm">
                <Link href={block.tool}>
                  Abrir herramienta <ExternalLink aria-hidden />
                </Link>
              </Button>
            )}
          </div>

          {metronomeConfig && <EmbeddedMetronome initial={metronomeConfig} />}

          {block.notes && (
            <p className="mt-3 rounded-md bg-accent/50 p-3 text-sm">{block.notes}</p>
          )}

          {children}

          <div className="mt-4 flex flex-wrap items-end gap-3">
            {block.log_bpm && (
              <div className="flex flex-col gap-1">
                <Label htmlFor={`bpm-${block.id}`}>bpm alcanzado</Label>
                <Input
                  id={`bpm-${block.id}`}
                  type="number"
                  inputMode="numeric"
                  min={20}
                  max={300}
                  value={bpmValue}
                  onChange={(e) => setBpmValue(e.target.value)}
                  className="w-28 font-mono"
                />
              </div>
            )}
            <Button onClick={handleComplete} disabled={done} className="ml-auto">
              <Check aria-hidden />
              {done ? "Completado" : "Completar bloque"}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
