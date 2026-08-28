"use client";

import { useState, useTransition } from "react";
import { Check, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { logBpm } from "@/app/actions/practice";

export interface EjercicioParaMarcar {
  slug: string;
  titulo: string;
  objetivo?: number;
  mejor?: number;
}

/**
 * Guardar la marca desde el metrónomo, que es donde se consigue.
 *
 * Antes el bpm solo se podía apuntar dentro del bloque de una lección: si
 * subías el tempo trasteando por tu cuenta, ese número se perdía. Y todo lo
 * que enseña el progreso —objetivos, metas paradas, resumen de la semana—
 * come de aquí.
 */
export function BpmQuickLog({
  ejercicios,
  inicial,
  bpm,
  demo,
}: {
  ejercicios: EjercicioParaMarcar[];
  /** el del enlace, o el último que marcaste: casi siempre es ese */
  inicial?: string;
  bpm: number;
  demo: boolean;
}) {
  const [slug, setSlug] = useState(inicial ?? "");
  const [limpio, setLimpio] = useState(true);
  const [guardado, setGuardado] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const elegido = ejercicios.find((e) => e.slug === slug);

  const guardar = () => {
    if (!elegido) return;
    startTransition(async () => {
      const r = await logBpm({ exerciseSlug: elegido.slug, bpm, clean: limpio });
      if (!r.ok && r.error !== "demo") {
        toast.error(`No se pudo guardar: ${r.error}`);
        return;
      }
      setGuardado(bpm);
      toast.success(
        r.ok
          ? `${bpm} bpm guardados en ${elegido.titulo}`
          : "Modo demo: la marca no se guarda",
      );
    });
  };

  return (
    <section aria-label="Guardar la marca" className="mt-6 rounded-xl border bg-card p-4">
      <h2 className="text-sm font-medium">Guardar esta marca</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {demo
          ? "En modo demo no se guarda, pero así es como funciona."
          : "El bpm que consigues aquí cuenta para tus objetivos."}
      </p>

      <div className="mt-3 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bpm-ejercicio">¿En qué ejercicio?</Label>
          <Select value={slug} onValueChange={setSlug}>
            <SelectTrigger id="bpm-ejercicio">
              <SelectValue placeholder="Elige el ejercicio" />
            </SelectTrigger>
            <SelectContent>
              {ejercicios.map((e) => (
                <SelectItem key={e.slug} value={e.slug}>
                  {e.titulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {elegido && (
          <p className="text-xs text-muted-foreground">
            {elegido.mejor !== undefined
              ? `Tu mejor marca: ${elegido.mejor} bpm`
              : "Todavía sin marca"}
            {elegido.objetivo !== undefined && ` · objetivo ${elegido.objetivo}`}
          </p>
        )}

        <div className="flex items-center gap-2">
          <Switch id="bpm-limpio" checked={limpio} onCheckedChange={setLimpio} />
          <Label htmlFor="bpm-limpio" className="font-normal">
            Salió limpio
          </Label>
        </div>

        <Button onClick={guardar} disabled={!elegido || pending} className="self-start">
          {guardado === bpm ? (
            <>
              <Check aria-hidden /> Guardado
            </>
          ) : (
            <>
              <Save aria-hidden /> Guardar {bpm} bpm
            </>
          )}
        </Button>
      </div>
    </section>
  );
}
