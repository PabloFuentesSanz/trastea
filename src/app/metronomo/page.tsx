import type { Metadata } from "next";
import { MetronomePageClient } from "@/components/metronome/metronome-page-client";
import { configFromParams } from "@/lib/metronome/url";

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

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Metrónomo</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Usable sin mirar: espacio arranca y para, flechas ajustan el tempo.
      </p>
      <MetronomePageClient initial={initial} />
    </main>
  );
}
