"use client";

import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * Una palabra del glosario dentro del texto: subrayada con puntos, y al
 * pulsarla sale su definición en una línea, con el enlace a la ficha entera
 * si la tiene. Sin salir de la página, que era el problema: la teoría estaba
 * a un clic pero el clic te sacaba de la lección.
 */
export function Termino({
  nombre,
  definicion,
  ficha,
  children,
}: {
  nombre: string;
  definicion: string;
  ficha?: string;
  children: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Qué es ${nombre}`}
          className="cursor-help underline decoration-primary/60 decoration-dotted underline-offset-4 hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 text-sm" align="start">
        <p className="font-medium">{nombre}</p>
        <p className="mt-1 text-muted-foreground">{definicion}</p>
        {ficha && (
          <Link
            href={`/wiki/${ficha}`}
            className="mt-2 inline-block text-xs text-primary hover:underline"
          >
            Leer la ficha entera →
          </Link>
        )}
      </PopoverContent>
    </Popover>
  );
}
