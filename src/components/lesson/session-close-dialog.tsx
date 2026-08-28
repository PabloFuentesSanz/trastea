"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** 1 a 5, con lo que significa cada uno dicho en guitarrista. */
const ANIMOS: { valor: number; cara: string; texto: string }[] = [
  { valor: 1, cara: "😤", texto: "Peleada" },
  { valor: 2, cara: "😕", texto: "Espesa" },
  { valor: 3, cara: "🙂", texto: "Normal" },
  { valor: 4, cara: "😃", texto: "Buena" },
  { valor: 5, cara: "🔥", texto: "De las que enganchan" },
];

export const MAX_NOTA = 280;

/**
 * El cierre de la sesión: cómo ha ido y una línea de qué ha pasado.
 *
 * Dos meses después, "el cambio a Bb no salía" explica una curva de bpm que
 * baja mucho mejor que la propia curva. Es opcional a propósito: si no
 * apetece escribir, se guarda igual.
 */
export function SessionCloseDialog({
  abierto,
  onCerrar,
  onGuardar,
  guardando,
}: {
  abierto: boolean;
  onCerrar: () => void;
  onGuardar: (datos: { mood?: number; notes?: string }) => void;
  guardando: boolean;
}) {
  const [mood, setMood] = useState<number | undefined>(undefined);
  const [nota, setNota] = useState("");

  return (
    <Dialog open={abierto} onOpenChange={(o) => !o && onCerrar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Cómo ha ido?</DialogTitle>
          <DialogDescription>
            Media línea basta. Dentro de dos meses te va a explicar la gráfica.
          </DialogDescription>
        </DialogHeader>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">La sesión</legend>
          <div className="flex flex-wrap gap-2">
            {ANIMOS.map((a) => (
              <button
                key={a.valor}
                type="button"
                aria-pressed={mood === a.valor}
                onClick={() => setMood(mood === a.valor ? undefined : a.valor)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border px-3 py-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  mood === a.valor
                    ? "border-primary bg-accent"
                    : "hover:border-primary/50",
                )}
              >
                <span aria-hidden className="text-lg">
                  {a.cara}
                </span>
                {a.texto}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nota-sesion">Qué ha pasado (opcional)</Label>
          <Textarea
            id="nota-sesion"
            value={nota}
            maxLength={MAX_NOTA}
            onChange={(e) => setNota(e.target.value)}
            placeholder="El cambio a Bb no llega a tiempo. Mañana, solo ese cambio."
            rows={3}
          />
          <p className="text-right text-[11px] text-muted-foreground">
            {nota.length}/{MAX_NOTA}
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onGuardar({})} disabled={guardando}>
            Guardar sin nota
          </Button>
          <Button
            onClick={() =>
              onGuardar({ mood, notes: nota.trim() ? nota.trim() : undefined })
            }
            disabled={guardando}
          >
            Guardar sesión
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
