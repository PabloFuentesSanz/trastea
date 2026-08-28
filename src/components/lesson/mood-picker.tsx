"use client";

import { cn } from "@/lib/utils";

/** 1 a 5, con lo que significa cada uno dicho en guitarrista. */
export const ANIMOS: { valor: number; cara: string; texto: string }[] = [
  { valor: 1, cara: "😤", texto: "Peleada" },
  { valor: 2, cara: "😕", texto: "Espesa" },
  { valor: 3, cara: "🙂", texto: "Normal" },
  { valor: 4, cara: "😃", texto: "Buena" },
  { valor: 5, cara: "🔥", texto: "De las que enganchan" },
];

export const MAX_NOTA = 280;

export function MoodPicker({
  valor,
  onCambio,
  leyenda = "La sesión",
}: {
  valor?: number;
  onCambio: (valor: number | undefined) => void;
  leyenda?: string;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">{leyenda}</legend>
      <div className="flex flex-wrap gap-2">
        {ANIMOS.map((a) => (
          <button
            key={a.valor}
            type="button"
            aria-pressed={valor === a.valor}
            onClick={() => onCambio(valor === a.valor ? undefined : a.valor)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg border px-3 py-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              valor === a.valor ? "border-primary bg-accent" : "hover:border-primary/50",
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
  );
}
