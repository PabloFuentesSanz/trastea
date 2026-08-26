"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface WikiEntry {
  slug: string;
  title: string;
  category: string;
  level: number;
  summary: string;
}

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

/** Normaliza para buscar sin acentos ni mayúsculas. */
function norm(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function WikiBrowser({ articles }: { articles: WikiEntry[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [level, setLevel] = useState<number | null>(null);

  const categories = useMemo(
    () => [...new Set(articles.map((a) => a.category))],
    [articles],
  );

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    return articles.filter((a) => {
      if (category && a.category !== category) return false;
      if (level && a.level !== level) return false;
      if (!q) return true;
      return norm(`${a.title} ${a.summary} ${a.slug}`).includes(q);
    });
  }, [articles, query, category, level]);

  const grouped = useMemo(() => {
    const map = new Map<string, WikiEntry[]>();
    for (const article of filtered) {
      const list = map.get(article.category) ?? [];
      list.push(article);
      map.set(article.category, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.level - b.level || a.title.localeCompare(b.title, "es"));
    }
    return [...map.entries()].sort(([a], [b]) =>
      (CATEGORY_LABEL[a] ?? a).localeCompare(CATEGORY_LABEL[b] ?? b, "es"),
    );
  }, [filtered]);

  const hasFilters = query !== "" || category !== null || level !== null;

  return (
    <div>
      <div className="relative mt-6">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar: pentatónica, cejilla, swing…"
          aria-label="Buscar en la wiki"
          className="pl-9"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {categories.map((c) => (
          <Button
            key={c}
            size="sm"
            variant={category === c ? "default" : "outline"}
            aria-pressed={category === c}
            onClick={() => setCategory(category === c ? null : c)}
          >
            {CATEGORY_LABEL[c] ?? c}
          </Button>
        ))}
        <span aria-hidden className="mx-1 h-5 w-px bg-border" />
        {[1, 2, 3].map((l) => (
          <Button
            key={l}
            size="sm"
            variant={level === l ? "default" : "outline"}
            aria-pressed={level === l}
            onClick={() => setLevel(level === l ? null : l)}
          >
            {LEVEL_LABEL[l]}
          </Button>
        ))}
        {hasFilters && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setQuery("");
              setCategory(null);
              setLevel(null);
            }}
          >
            <X aria-hidden /> Limpiar
          </Button>
        )}
        <span className="ml-auto text-sm text-muted-foreground">
          {filtered.length} de {articles.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 rounded-lg border p-6 text-center text-sm text-muted-foreground">
          Nada por aquí. Prueba con otra palabra o quita los filtros.
        </p>
      ) : (
        grouped.map(([cat, list]) => (
          <section key={cat} aria-label={CATEGORY_LABEL[cat] ?? cat} className="mt-8">
            <h2 className="text-lg font-medium">{CATEGORY_LABEL[cat] ?? cat}</h2>
            <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {list.map((article) => (
                <li key={article.slug}>
                  <Link
                    href={`/wiki/${article.slug}`}
                    className={cn(
                      "flex h-full flex-col gap-1 rounded-lg border p-3 transition-colors",
                      "hover:border-primary/50 hover:bg-secondary",
                    )}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="font-medium">{article.title}</span>
                      <Badge variant="outline" className="shrink-0">
                        {LEVEL_LABEL[article.level] ?? article.level}
                      </Badge>
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {article.summary}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
