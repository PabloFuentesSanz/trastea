import Link from "next/link";
import type { Metadata } from "next";
import { Mic } from "lucide-react";
import { RecordingsList } from "@/components/assessment/recordings-list";
import { Recorder } from "@/components/assessment/recorder";
import { getLesson } from "@/lib/content/loader";
import { getRecordings, getUserContext } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Grabaciones" };

export default async function GrabacionesPage() {
  const ctx = await getUserContext();
  const recordings = ctx.userId ? await getRecordings(ctx.userId) : [];

  const items = recordings.map((r) => ({
    ...r,
    lessonTitle: r.lessonSlug
      ? (getLesson(r.lessonSlug)?.frontmatter.title ?? null)
      : null,
  }));

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
        <Mic className="size-7 text-primary" aria-hidden /> Grabaciones
      </h1>
      <p className="mt-1 text-muted-foreground">
        Grabarte es el espejo: oyes lo que tocas, no lo que crees que tocas. Y dentro de
        tres meses, la comparación te dará una alegría.
      </p>

      <div className="mt-6">
        <Recorder defaultTitle={`Grabación ${new Date().toLocaleDateString("es")}`} />
      </div>

      {!ctx.userId ? (
        <p className="mt-8 rounded-lg border p-6 text-center text-sm text-muted-foreground">
          Inicia sesión para guardar y conservar tus grabaciones.{" "}
          <Link href="/login" className="text-primary underline-offset-4 hover:underline">
            Entrar
          </Link>
        </p>
      ) : (
        <div className="mt-8">
          <RecordingsList items={items} />
        </div>
      )}
    </main>
  );
}
