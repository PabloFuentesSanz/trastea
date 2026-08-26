import type { Metadata } from "next";
import { Brain, Clock, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { TrainingSession } from "@/components/srs/training-session";
import { getTrainingDeck, getUserContext } from "@/lib/queries";

export const metadata: Metadata = { title: "Entrenar" };

/** El mazo depende del progreso del usuario y del reloj. */
export const dynamic = "force-dynamic";

/** Tamaño de sesión: ~5 minutos con la guitarra en la mano. */
const SESSION_SIZE = 20;

export default async function EntrenarPage() {
  const ctx = await getUserContext();
  const deck = await getTrainingDeck(ctx.userId, SESSION_SIZE);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Entrenar</h1>
      <p className="mt-1 text-muted-foreground">
        Notas del mástil con repetición espaciada: te pregunta lo que peor llevas y
        te deja en paz con lo que ya sabes. Cinco minutos al día bastan.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Clock className="size-4 text-primary" aria-hidden /> Tocan hoy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="display-number text-3xl">{deck.due}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Sparkles className="size-4 text-primary" aria-hidden /> Sin estrenar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="display-number text-3xl">{deck.fresh}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Brain className="size-4 text-primary" aria-hidden /> Consolidadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="display-number text-3xl">
              {deck.learned}
              <span className="text-lg text-muted-foreground">/{deck.total}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {!ctx.userId && (
        <p className="mt-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
          Sin sesión iniciada puedes entrenar, pero el sistema no recordará qué
          notas te cuestan.
        </p>
      )}

      <TrainingSession cards={deck.session} demo={!ctx.userId} />
    </main>
  );
}
