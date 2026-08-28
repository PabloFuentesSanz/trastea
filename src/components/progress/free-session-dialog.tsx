"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_NOTA, MoodPicker } from "@/components/lesson/mood-picker";
import { logFreeSession } from "@/app/actions/practice";
import { todayLocal } from "@/lib/date";

/** los ratos típicos, para no teclear */
const RATOS = [15, 20, 30, 45, 60];

/**
 * Registrar la práctica que no es la lección del día.
 *
 * Media hora con el metrónomo, o tocando canciones, contaba como cero: rompía
 * la racha y dejaba el día en blanco en el calendario. Practicar es practicar.
 */
export function FreeSessionDialog({
  variant = "secondary",
}: {
  variant?: "secondary" | "outline";
}) {
  const [abierto, setAbierto] = useState(false);
  const [minutos, setMinutos] = useState(30);
  const [mood, setMood] = useState<number | undefined>(undefined);
  const [nota, setNota] = useState("");
  const [pending, startTransition] = useTransition();

  const guardar = () => {
    startTransition(async () => {
      const r = await logFreeSession({
        date: todayLocal(),
        durationMin: minutos,
        mood,
        notes: nota.trim() ? nota.trim() : undefined,
      });
      if (!r.ok && r.error !== "demo") {
        toast.error(`No se pudo guardar: ${r.error}`);
        return;
      }
      setAbierto(false);
      setNota("");
      setMood(undefined);
      toast.success(
        r.ok
          ? `${minutos} minutos guardados. 🔥 La racha cuenta.`
          : "Modo demo: la sesión no se guarda",
      );
    });
  };

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button variant={variant}>
          <Plus aria-hidden /> Registrar práctica libre
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Práctica libre</DialogTitle>
          <DialogDescription>
            Lo que has tocado hoy sin ser la lección. Cuenta igual para la racha y para el
            calendario.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="minutos-libres">Cuánto rato</Label>
          <div className="flex flex-wrap gap-2">
            {RATOS.map((m) => (
              <Button
                key={m}
                type="button"
                size="sm"
                variant={minutos === m ? "default" : "outline"}
                onClick={() => setMinutos(m)}
              >
                {m} min
              </Button>
            ))}
          </div>
          <Input
            id="minutos-libres"
            type="number"
            min={1}
            max={600}
            value={minutos}
            onChange={(e) => setMinutos(Number(e.target.value))}
            className="mt-1 w-28"
            aria-label="Minutos practicados"
          />
        </div>

        <MoodPicker valor={mood} onCambio={setMood} leyenda="Cómo ha ido" />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nota-libre">Qué has tocado (opcional)</Label>
          <Textarea
            id="nota-libre"
            value={nota}
            maxLength={MAX_NOTA}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Media hora de cromático y el riff de siempre."
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button onClick={guardar} disabled={pending || minutos <= 0}>
            Guardar sesión
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
