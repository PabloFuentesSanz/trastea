import { redirect } from "next/navigation";
import { getLesson, getOrderedLessons } from "@/lib/content/loader";
import { getUserContext } from "@/lib/queries";

/**
 * Depende del usuario, y sin sesión no puede quedarse prerenderizada: una
 * página estática con `redirect()` se sirve como <meta refresh> de un
 * segundo, y ese refresco tardío abortaba la navegación siguiente.
 */
export const dynamic = "force-dynamic";

/** Atajo a la lección que toca hoy. */
export default async function HoyPage() {
  const ctx = await getUserContext();
  const ordered = getOrderedLessons();

  const slug = ctx.profile?.current_lesson_slug ?? ordered[0]?.frontmatter.slug;
  const lesson = slug ? getLesson(slug) : null;
  const target = lesson ?? ordered[0] ?? null;

  if (!target) redirect("/curso");
  redirect(`/curso/${target.moduleSlug}/${target.frontmatter.slug}`);
}
