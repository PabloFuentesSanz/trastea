import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mdx } from "@/components/content/mdx";
import {
  getLesson,
  getWikiArticle,
  getWikiArticles,
  getWikiBacklinks,
  resolveInterlinks,
} from "@/lib/content/loader";

const CATEGORY_LABEL: Record<string, string> = {
  teoria: "Teoría",
  tecnica: "Técnica",
  ritmo: "Ritmo",
  equipo: "Equipo",
  historia: "Historia",
  glosario: "Glosario",
};

const LEVEL_LABEL: Record<number, string> = {
  1: "Base",
  2: "Medio",
  3: "Avanzado",
};

export function generateStaticParams() {
  return getWikiArticles().map((a) => ({ slug: a.frontmatter.slug }));
}

export default async function WikiArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getWikiArticle(slug);
  if (!article) notFound();

  const backlinks = getWikiBacklinks(slug);
  const body = resolveInterlinks(article.body);

  const category =
    CATEGORY_LABEL[article.frontmatter.category] ?? article.frontmatter.category;
  const level =
    LEVEL_LABEL[article.frontmatter.level] ?? String(article.frontmatter.level);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <p className="text-xs text-muted-foreground">
        <Link href="/wiki" className="hover:text-foreground">
          Wiki
        </Link>{" "}
        / {category}
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">
        {article.frontmatter.title}
      </h1>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{category}</Badge>
        <Badge variant="outline">{level}</Badge>
      </div>
      <p className="mt-3 text-muted-foreground">{article.frontmatter.summary}</p>

      {/* en el propio glosario las definiciones ya están escritas */}
      <Mdx source={body} className="mt-6" glosario={slug !== "glosario"} />

      {article.frontmatter.related.length > 0 && (
        <>
          <Separator className="my-8" />
          <section aria-label="Relacionados">
            <h2 className="text-sm font-medium text-muted-foreground">Relacionados</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {article.frontmatter.related.map((rel) => {
                const relArticle = getWikiArticle(rel);
                return (
                  <Link key={rel} href={`/wiki/${rel}`}>
                    <Badge variant="secondary">
                      {relArticle?.frontmatter.title ?? rel}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          </section>
        </>
      )}

      {backlinks.length > 0 && (
        <section aria-label="Aparece en" className="mt-6">
          <h2 className="text-sm font-medium text-muted-foreground">
            Este artículo aparece en…
          </h2>
          <ul className="mt-2 space-y-1 text-sm">
            {backlinks.map((link) => {
              const href =
                link.kind === "lesson"
                  ? `/curso/${getLesson(link.slug)?.moduleSlug ?? ""}/${link.slug}`
                  : link.kind === "wiki"
                    ? `/wiki/${link.slug}`
                    : `/canciones/${link.slug}`;
              return (
                <li key={`${link.kind}-${link.slug}`}>
                  <Link
                    href={href}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {link.title}
                  </Link>{" "}
                  <span className="text-muted-foreground">
                    (
                    {link.kind === "lesson"
                      ? "lección"
                      : link.kind === "wiki"
                        ? "wiki"
                        : "canción"}
                    )
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
