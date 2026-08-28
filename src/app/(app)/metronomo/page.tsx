import type { Metadata } from "next";
import { MetronomePageClient } from "@/components/metronome/metronome-page-client";
import { configFromParams } from "@/lib/metronome/url";
import { getExercises } from "@/lib/content/loader";
import { getMetasDeBpm, getUltimoEjercicioMarcado, getUserContext } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Metrónomo",
};

export default async function MetronomoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const initial = configFromParams(params);

  // la marca se guarda donde se consigue: aquí, no solo dentro de una lección
  const ctx = await getUserContext();
  const metas = await getMetasDeBpm(
    ctx.userId,
    getExercises().map((e) => ({
      slug: e.frontmatter.slug,
      titulo: e.frontmatter.title,
      objetivo: e.frontmatter.bpm_target,
    })),
  );
  const ejercicios = getExercises().map((e) => {
    const meta = metas.find((m) => m.slug === e.frontmatter.slug);
    return {
      slug: e.frontmatter.slug,
      titulo: e.frontmatter.title,
      objetivo: e.frontmatter.bpm_target,
      mejor: meta?.mejor,
    };
  });
  // el del enlace manda; si no, el último que marcaste, que casi siempre es
  // el que sigues trabajando
  const delEnlace =
    typeof params.ej === "string" && ejercicios.some((e) => e.slug === params.ej)
      ? params.ej
      : undefined;
  const ejercicioInicial =
    delEnlace ??
    (ctx.userId
      ? ((await getUltimoEjercicioMarcado(ctx.userId)) ?? undefined)
      : undefined);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Metrónomo</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Usable sin mirar: espacio arranca y para, flechas ajustan el tempo.
      </p>
      <MetronomePageClient
        initial={initial}
        ejercicios={ejercicios}
        ejercicioInicial={ejercicioInicial}
        demo={!ctx.userId}
      />
    </main>
  );
}
