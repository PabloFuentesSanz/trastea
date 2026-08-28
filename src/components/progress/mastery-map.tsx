import Link from "next/link";
import { TrainFretboard, type FretMark } from "@/components/train/train-fretboard";
import {
  resumenDeDominio,
  type NivelDeDominio,
  type NotaDelMapa,
} from "@/lib/progress/mastery";

const LEYENDA: {
  nivel: Exclude<NivelDeDominio, "sin-ver">;
  color: string;
  texto: string;
}[] = [
  { nivel: "dominada", color: "bg-success", texto: "Te sale sola" },
  { nivel: "en-marcha", color: "bg-primary", texto: "En marcha" },
  { nivel: "floja", color: "bg-destructive", texto: "Se te cae" },
];

/**
 * El mástil pintado por lo bien que llevas cada nota. Las que no has visto
 * nunca no se dibujan: el hueco también informa —es el territorio que te
 * queda por pisar—.
 */
export function MasteryMap({ mapa }: { mapa: NotaDelMapa[] }) {
  const resumen = resumenDeDominio(mapa);

  if (resumen.vistas === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no hay nada que pintar. Sale de{" "}
        <Link href="/entrenar/notas-del-mastil" className="text-primary hover:underline">
          las notas del mástil
        </Link>
        : en cuanto respondas unas cuantas, aparecen aquí.
      </p>
    );
  }

  const marks: FretMark[] = mapa
    .filter(
      (n): n is NotaDelMapa & { nivel: Exclude<NivelDeDominio, "sin-ver"> } =>
        n.nivel !== "sin-ver",
    )
    .map((n) => ({ position: n.position, kind: n.nivel }));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {resumen.dominadas === 1
          ? "1 nota te sale sola"
          : `${resumen.dominadas} notas te salen solas`}
        , {resumen.enMarcha} en marcha y {resumen.flojas} que se te caen. De {mapa.length}{" "}
        estudiadas.
      </p>
      <div className="overflow-x-auto">
        <TrainFretboard
          marks={marks}
          ariaLabel={`Mástil por dominio: ${resumen.dominadas} dominadas, ${resumen.enMarcha} en marcha, ${resumen.flojas} flojas`}
          className="min-w-[560px]"
        />
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {LEYENDA.map((l) => (
          <li key={l.nivel} className="flex items-center gap-1.5">
            <span aria-hidden className={`size-2.5 rounded-full ${l.color}`} />
            {l.texto}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-full border" />
          Sin pisar todavía
        </li>
      </ul>
    </div>
  );
}
