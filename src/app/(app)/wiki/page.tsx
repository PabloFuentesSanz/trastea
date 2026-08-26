import type { Metadata } from "next";
import { WikiBrowser, type WikiEntry } from "@/components/content/wiki-browser";
import { getWikiArticles } from "@/lib/content/loader";

export const metadata: Metadata = { title: "Wiki" };

export default function WikiPage() {
  const articles: WikiEntry[] = getWikiArticles().map(({ frontmatter }) => ({
    slug: frontmatter.slug,
    title: frontmatter.title,
    category: frontmatter.category,
    level: frontmatter.level,
    summary: frontmatter.summary,
  }));

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Wiki</h1>
      <p className="mt-1 text-muted-foreground">
        La teoría que necesitas, sin humo y con ejemplos en el mástil. Cada ficha te dice
        cómo suena, dónde la has oído y cómo estudiarla.
      </p>
      <WikiBrowser articles={articles} />
    </main>
  );
}
