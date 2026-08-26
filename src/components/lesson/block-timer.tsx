"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function format(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function BlockTimer({
  minutes,
  large = false,
  onFinish,
}: {
  minutes: number;
  large?: boolean;
  onFinish?: () => void;
}) {
  const total = minutes * 60;
  const [remaining, setRemaining] = useState(total);
  const [running, setRunning] = useState(false);
  const endAtRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const clear = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  useEffect(() => clear, [clear]);

  const start = useCallback(() => {
    setRunning(true);
    setRemaining((current) => {
      endAtRef.current = Date.now() + current * 1000;
      return current;
    });
    clear();
    intervalRef.current = setInterval(() => {
      const endAt = endAtRef.current;
      if (endAt === null) return;
      const left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        clear();
        setRunning(false);
        onFinishRef.current?.();
      }
    }, 250);
  }, [clear]);

  const pause = useCallback(() => {
    setRunning(false);
    clear();
  }, [clear]);

  const reset = useCallback(() => {
    pause();
    setRemaining(total);
  }, [pause, total]);

  const finished = remaining === 0;

  return (
    <div className="flex items-center gap-2">
      <span
        role="timer"
        aria-label={`Tiempo restante ${format(remaining)}`}
        className={cn(
          "display-number tabular-nums",
          large ? "text-7xl md:text-8xl" : "text-2xl",
          finished ? "text-success" : running ? "text-primary" : "text-foreground",
        )}
      >
        {format(remaining)}
      </span>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size={large ? "default" : "icon"}
          className={cn(!large && "size-8")}
          onClick={running ? pause : start}
          aria-label={running ? "Pausar timer" : "Arrancar timer"}
          disabled={finished}
        >
          {running ? <Pause aria-hidden /> : <Play aria-hidden />}
          {large && (running ? "Pausar" : "Arrancar")}
        </Button>
        <Button
          variant="ghost"
          size={large ? "default" : "icon"}
          className={cn(!large && "size-8")}
          onClick={reset}
          aria-label="Reiniciar timer"
        >
          <RotateCcw aria-hidden />
        </Button>
      </div>
    </div>
  );
}
