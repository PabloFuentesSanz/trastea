import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { getWikiArticles } from "@/lib/content/loader";
import type { WikiFrontmatter } from "@/lib/content/schemas";

export const metadata: Metadata = { title: "Wiki" };

const CATEGORY_LABEL: Record<WikiFrontmatter["category"], string> = {
  teoria: "Teoría",
  tecnica: "Técnica",
  ritmo: "Ritmo",
  equipo: "Equipo",
  historia: "Historia",
  glosario: "Glosario",
};

export default function WikiPage() {
  const articles = getWikiArticles();
  const categories = Object.keys(CATEGORY_LABEL) as WikiFrontmatter["category"][];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Wiki</h1>
      <p className="mt-1 text-muted-foreground">
        La teoría que necesitas, sin humo y con ejemplos en el mástil.
      </p>

      {categories.map((category) => {
        const inCategory = articles
          .filter((a) => a.frontmatter.category === category)
          .sort((a, b) => a.frontmatter.title.localeCompare(b.frontmatter.title, "es"));
        if (inCategory.length === 0) return null;
        return (
          <section key={category} aria-label={CATEGORY_LABEL[category]} className="mt-8">
            <h2 className="text-lg font-medium">{CATEGORY_LABEL[category]}</h2>
            <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {inCategory.map((article) => (
                <li key={article.frontmatter.slug}>
                  <Link
                    href={`/wiki/${article.frontmatter.slug}`}
                    className="flex h-full flex-col gap-1 rounded-lg border p-3 transition-colors hover:bg-secondary"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-medium">{article.frontmatter.title}</span>
                      <Badge variant="outline">N{article.frontmatter.level}</Badge>
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {article.frontmatter.summary}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
