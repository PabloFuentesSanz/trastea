import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Acorde } from "@/components/content/music-blocks";
import { ChordChanges } from "@/components/train/chord-changes";
import { getChordChangeBests, getUserContext } from "@/lib/queries";
import { CAMBIOS_DE_ACORDE_SLUG, getDrill } from "@/lib/train/catalog";
import {
  CAMBIOS_PARA_SUBIR,
  PAREJAS,
  parejaPorId,
  siguientePareja,
} from "@/lib/train/chord-changes";
import { isTrainLevel, TRAIN_LEVEL_LABEL, type TrainLevel } from "@/lib/train/taxonomy";
import { cn } from "@/lib/utils";

/** Las marcas dependen del usuario. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Cambios de acorde en un minuto" };

export default async function CambiosDeAcordePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const drill = getDrill(CAMBIOS_DE_ACORDE_SLUG);
  const nivelPedido = Number(typeof sp.nivel === "string" ? sp.nivel : "");
  const nivel: TrainLevel = isTrainLevel(nivelPedido) ? nivelPedido : 1;
  const pedida = typeof sp.pareja === "string" ? parejaPorId(sp.pareja) : undefined;
  const pareja = pedida ?? PAREJAS.find((p) => p.level === nivel) ?? PAREJAS[0];

  const ctx = await getUserContext();
  const marcas = await getChordChangeBests(ctx.userId);
  const mejorDe = (id: string) => marcas.find((m) => m.pair === id)?.best ?? null;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link
        href="/entrenar"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden /> Entrenar
      </Link>
      <h1 className="mt-2 text-4xl">
        {drill?.title ?? "Cambios de acorde en un minuto"}
      </h1>
      <p className="text-muted-foreground mt-3">
        {drill?.summary} Cuenta solo los cambios en los que suenan todas las cuerdas:
        subir el número mintiendo es la forma más rápida de dejar de mejorar.
      </p>

      <section aria-label="Parejas" className="mt-6">
        <h2 className="lbl">Elige la pareja</h2>
        <div className="mt-2 flex flex-col gap-3">
          {([1, 2, 3] as const).map((level) => (
            <div key={level}>
              <p className="text-xs text-muted-foreground">
                Nivel {level} · {TRAIN_LEVEL_LABEL[level]}
              </p>
              <ul className="mt-1 flex flex-wrap gap-2">
                {PAREJAS.filter((p) => p.level === level).map((p) => {
                  const mejor = mejorDe(p.id);
                  const activa = p.id === pareja.id;
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/entrenar/cambios-de-acorde?pareja=${p.id}`}
                        aria-current={activa ? "true" : undefined}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                          activa
                            ? "border-primary bg-primary text-primary-foreground"
                            : "bg-card hover:border-primary/50",
                        )}
                      >
                        <span className="font-mono">
                          {p.acordes[0]} ↔ {p.acordes[1]}
                        </span>
                        {mejor !== null && (
                          <Badge
                            variant={
                              mejor >= CAMBIOS_PARA_SUBIR ? "default" : "secondary"
                            }
                            className={cn(
                              "font-mono",
                              activa && "bg-primary-foreground text-primary",
                            )}
                          >
                            {mejor}
                          </Badge>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <ChordChanges
        key={pareja.id}
        pareja={pareja}
        siguiente={siguientePareja(pareja.id)}
        mejor={mejorDe(pareja.id)}
        demo={!ctx.userId}
        diagramas={pareja.acordes.map((nombre) => (
          <Acorde key={nombre} nombre={nombre} trastes={pareja.trastes?.[nombre]} />
        ))}
      />

      {!ctx.userId && (
        <p className="border-primary/30 bg-primary/10 text-primary mt-4 rounded-lg border px-3 py-2 text-xs">
          Sin sesión iniciada puedes entrenar, pero las marcas no se guardan.
        </p>
      )}
    </main>
  );
}
