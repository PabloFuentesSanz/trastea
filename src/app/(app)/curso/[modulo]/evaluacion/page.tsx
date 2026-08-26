import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ClipboardCheck, Mic, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { QuizRunner } from "@/components/assessment/quiz-runner";
import { Recorder } from "@/components/assessment/recorder";
import { ChecklistCard } from "@/components/assessment/checklist-card";
import { getCourse, getModule, getQuiz } from "@/lib/content/loader";
import { getModuleAssessment, getUserContext } from "@/lib/queries";
import { assessmentProgress, isModuleAssessmentComplete } from "@/lib/assessment/scoring";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Evaluación" };

export function generateStaticParams() {
  return getCourse()
    .filter((m) => m.frontmatter.assessment)
    .map((m) => ({ modulo: m.frontmatter.slug }));
}

export default async function EvaluacionPage({
  params,
}: {
  params: Promise<{ modulo: string }>;
}) {
  const { modulo } = await params;
  const mod = getModule(modulo);
  const assessment = mod?.frontmatter.assessment;
  if (!mod || !assessment) notFound();

  const quiz = assessment.quiz_slug ? getQuiz(assessment.quiz_slug) : null;
  const ctx = await getUserContext();
  const state = ctx.userId
    ? await getModuleAssessment(ctx.userId, modulo)
    : { quizPassed: false, checklistDone: [], hasRecording: false };

  const checklist = assessment.checklist;
  const summary = {
    quizPassed: state.quizPassed,
    checklistDone: state.checklistDone.length,
    checklistTotal: checklist.length,
    hasRecording: state.hasRecording,
  };
  const complete = isModuleAssessmentComplete(summary);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <p className="text-xs text-muted-foreground">
        <Link href="/curso" className="hover:text-foreground">
          Curso
        </Link>{" "}
        /{" "}
        <Link href={`/curso/${modulo}`} className="hover:text-foreground">
          {mod.frontmatter.title}
        </Link>
      </p>
      <h1 className="mt-1 flex items-center gap-2 text-3xl font-semibold tracking-tight">
        Evaluación
        {complete && (
          <Badge className="bg-success text-success-foreground">Superada</Badge>
        )}
      </h1>
      <p className="mt-1 text-muted-foreground">
        Tres patas: la teoría (quiz), las manos (checklist) y la prueba real (grabación).
        No hay límite de intentos.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <Progress
          value={assessmentProgress(summary) * 100}
          className="h-2"
          aria-label="Progreso de la evaluación"
        />
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {Math.round(assessmentProgress(summary) * 100)}%
        </span>
      </div>

      {complete && (
        <p className="mt-4 flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
          <Trophy className="size-4" aria-hidden />
          Módulo superado. El siguiente te espera.
        </p>
      )}

      {/* 1. Quiz */}
      <section aria-label="Quiz" className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-medium">
          <ClipboardCheck className="size-5 text-primary" aria-hidden /> 1. La teoría
        </h2>
        {quiz ? (
          <div className="mt-4">
            <QuizRunner
              moduleSlug={modulo}
              passScore={quiz.frontmatter.pass_score}
              alreadyPassed={state.quizPassed}
              questions={quiz.frontmatter.questions.map((q) => ({
                q: q.q,
                options: q.options,
              }))}
            />
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Este módulo aún no tiene quiz.
          </p>
        )}
      </section>

      {/* 2. Checklist */}
      {checklist.length > 0 && (
        <section aria-label="Checklist" className="mt-10">
          <h2 className="flex items-center gap-2 text-xl font-medium">
            <ClipboardCheck className="size-5 text-primary" aria-hidden /> 2. Las manos
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sé honesto: el metrónomo no miente y esto es para ti.
          </p>
          <div className="mt-4">
            <ChecklistCard
              moduleSlug={modulo}
              items={checklist}
              initialDone={state.checklistDone}
              demo={!ctx.userId}
            />
          </div>
        </section>
      )}

      {/* 3. Grabación */}
      <section aria-label="Grabación" className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-medium">
          <Mic className="size-5 text-primary" aria-hidden /> 3. La prueba real
        </h2>
        {assessment.recording_prompt && (
          <p className="mt-2 rounded-lg border border-primary/30 bg-accent/40 p-3 text-sm">
            🎯 {assessment.recording_prompt}
          </p>
        )}
        <div className="mt-4">
          <Recorder
            defaultTitle={`Evaluación — ${mod.frontmatter.title}`}
            moduleSlug={modulo}
          />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {state.hasRecording ? (
            <>
              Ya tienes una grabación de este módulo.{" "}
              <Link
                href="/grabaciones"
                className="text-primary underline-offset-4 hover:underline"
              >
                Ver mis grabaciones
              </Link>
            </>
          ) : (
            "Grábate entero, con los fallos dentro: así se toca delante de gente."
          )}
        </p>
      </section>
    </main>
  );
}
