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
import { MAX_NOTA, MoodPicker } from "./mood-picker";

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

        <MoodPicker valor={mood} onCambio={setMood} />

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
