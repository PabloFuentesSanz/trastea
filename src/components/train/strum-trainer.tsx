"use client";

import { useState } from "react";
import { PlayableStrum } from "@/components/backing/playable-strum";
import { BUCLES, PATRONES } from "@/lib/train/strum-presets";
import { TRAIN_LEVEL_LABEL, type TrainLevel } from "@/lib/train/taxonomy";
import { cn } from "@/lib/utils";

/**
 * El patrón de rasgueo con el click: eliges patrón y bucle de acordes, lo
 * oyes y tocas encima. Lo que se entrena es que la mano no se pare en los
 * huecos, y eso se ve en las flechas mientras suena.
 */
export function StrumTrainer({ nivel }: { nivel: TrainLevel }) {
  const [patronId, setPatronId] = useState(
    PATRONES.find((p) => p.level === nivel)?.id ?? PATRONES[0].id,
  );
  const [bucleId, setBucleId] = useState(BUCLES[0].id);
  const patron = PATRONES.find((p) => p.id === patronId) ?? PATRONES[0];
  const bucle = BUCLES.find((b) => b.id === bucleId) ?? BUCLES[0];
  const acordes = bucle.acordes.split("|").map((c) => c.trim());

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-[16rem_1fr]">
      <div className="flex flex-col gap-4">
        <fieldset>
          <legend className="lbl">Patrón</legend>
          <ul className="mt-2 flex flex-col gap-1.5">
            {PATRONES.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={p.id === patron.id}
                  onClick={() => setPatronId(p.id)}
                  className={cn(
                    "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
                    p.id === patron.id
                      ? "border-primary bg-accent"
                      : "bg-card hover:border-primary/50",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-medium">{p.nombre}</span>
                    <span className="text-muted-foreground text-xs">
                      {TRAIN_LEVEL_LABEL[p.level]}
                    </span>
                  </span>
                  <span className="text-muted-foreground block font-mono text-xs">
                    {p.patron}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </fieldset>
        <fieldset>
          <legend className="lbl">Sobre qué acordes</legend>
          <ul className="mt-2 flex flex-wrap gap-2">
            {BUCLES.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  aria-pressed={b.id === bucle.id}
                  onClick={() => setBucleId(b.id)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm transition-colors",
                    b.id === bucle.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-card hover:border-primary/50",
                  )}
                >
                  {b.nombre}
                </button>
              </li>
            ))}
          </ul>
        </fieldset>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm">
          <span className="font-medium">{patron.nombre}.</span>{" "}
          <span className="text-muted-foreground">{patron.dondeSuena}</span>
        </p>
        <div className="mt-3">
          <PlayableStrum
            key={`${patron.id}-${bucle.id}`}
            patron={patron.patron}
            acordes={acordes}
            compases={acordes.length > 1 ? acordes.length : 2}
            bpm={70}
            tocable
            id={`entrenar-${patron.id}`}
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Toca encima con la guitarra. La mano baja en los números y sube en los «y»
          aunque no toque las cuerdas: los puntos son golpes en el aire. Sube 5 bpm cuando
          dos vueltas salgan sin que la mano se pare.
        </p>
      </div>
    </div>
  );
}
