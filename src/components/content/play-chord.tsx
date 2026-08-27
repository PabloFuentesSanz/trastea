"use client";

import { useCallback, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playNotes } from "@/lib/audio/pluck";

/**
 * Escuchar un acorde del contenido, rasgueado como una púa de verdad.
 *
 * Un ejercicio de oído que enseña cuatro diagramas y te manda a otra página
 * para oírlos no es un ejercicio de oído. Suena con el instrumento que tengas
 * elegido, igual que las bases y las tabs.
 */
export function PlayChord({
  midis,
  nombre,
}: {
  midis: readonly number[];
  nombre: string;
}) {
  const [sonando, setSonando] = useState(false);
  const timeout = useRef(0);

  const tocar = useCallback(async () => {
    window.clearTimeout(timeout.current);
    setSonando(true);
    const segundos = await playNotes(midis, { strum: 0.035, duration: 1.5 });
    timeout.current = window.setTimeout(() => setSonando(false), segundos * 1000);
  }, [midis]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-7 w-full gap-1.5 text-xs"
      aria-label={`Escuchar ${nombre}`}
      onClick={() => void tocar()}
    >
      <Volume2 className={sonando ? "text-primary size-3.5" : "size-3.5"} aria-hidden />
      {sonando ? "Sonando" : "Escuchar"}
    </Button>
  );
}
