"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ResumenDeEjercicio } from "@/lib/content/exercise-summary";

/**
 * El ejercicio dentro del bloque, plegado. Lo que se ve sin tocar nada son
 * las dos líneas que dice un profesor —qué haces y para qué— y la ficha
 * entera (tab, mástil, rutina) se abre solo si la quieres. Antes venía
 * abierta siempre: un día con cinco bloques eran 14-24 pantallas de móvil.
 */
export function ExerciseFold({
  slug,
  resumen,
  children,
}: {
  slug: string;
  resumen: ResumenDeEjercicio;
  children: ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  const id = `ejercicio-${slug}`;

  return (
    <div className="mt-3">
      {(resumen.queEs || resumen.paraQue) && (
        <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
          {resumen.queEs && (
            <>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground sm:pt-0.5">
                Qué haces
              </dt>
              <dd>{resumen.queEs}</dd>
            </>
          )}
          {resumen.paraQue && (
            <>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground sm:pt-0.5">
                Para qué
              </dt>
              <dd>{resumen.paraQue}</dd>
            </>
          )}
        </dl>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={abierto}
          aria-controls={id}
          onClick={() => setAbierto((v) => !v)}
        >
          <ChevronDown
            aria-hidden
            className={cn("transition-transform", abierto && "rotate-180")}
          />
          {abierto ? "Plegar el ejercicio" : "Ver el ejercicio entero"}
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/ejercicios/${slug}`}>
            Ficha y marcas <ExternalLink aria-hidden />
          </Link>
        </Button>
      </div>
      <div
        id={id}
        hidden={!abierto}
        className="mt-3 rounded-lg border bg-background/40 p-4"
      >
        {children}
      </div>
    </div>
  );
}
