"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EMPTY_SONG_FILTERS,
  facetCounts,
  filterSongs,
  hasActiveFilters,
  chordVocabulary,
  parseSongFilters,
  songFiltersToQuery,
  SONG_LEVELS,
  type SongCard,
  type SongFilters,
} from "@/lib/content/song-filter";
import {
  SONG_COLLECTIONS,
  SONG_LEVEL_LABEL,
  SONG_STYLE_LABEL,
  SONG_STYLES,
  SONG_TECHNIQUES,
  TECHNIQUE_GROUP_LABEL,
  collectionLabel,
  collectionTagline,
  techniqueGroup,
  techniqueLabel,
  type SongCollection,
  type SongStyle,
  type SongTechnique,
  type TechniqueGroup,
} from "@/lib/content/song-taxonomy";
import { cn } from "@/lib/utils";

/** Alterna un valor dentro de una lista de filtros. */
function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function FacetButton({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count: number | undefined;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const disabled = !active && !count;
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-card hover:border-primary/50 hover:bg-secondary",
        disabled && "cursor-not-allowed opacity-40 hover:border-border hover:bg-card",
      )}
    >
      {children}
      <span
        className={cn(
          "text-xs tabular-nums",
          active ? "opacity-80" : "text-muted-foreground",
        )}
      >
        {count ?? 0}
      </span>
    </button>
  );
}

export function SongBrowser({ songs }: { songs: SongCard[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => parseSongFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const apply = useCallback(
    (next: SongFilters) => {
      const query = songFiltersToQuery(next);
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  // El texto se escribe en local y sube a la URL con un respiro, para no
  // empujar una entrada de historial por cada tecla.
  const [draft, setDraft] = useState(filters.query);
  const [syncedQuery, setSyncedQuery] = useState(filters.query);
  if (syncedQuery !== filters.query) {
    // La URL ha cambiado por fuera (deep link, atrás/adelante): reajustamos el
    // borrador durante el render, que es como React recomienda hacerlo.
    setSyncedQuery(filters.query);
    setDraft(filters.query);
  }
  useEffect(() => {
    if (draft === filters.query) return;
    const id = setTimeout(() => apply({ ...filters, query: draft }), 250);
    return () => clearTimeout(id);
  }, [draft, filters, apply]);

  const [showAllFacets, setShowAllFacets] = useState(false);

  const results = useMemo(() => filterSongs(songs, filters), [songs, filters]);
  const counts = useMemo(() => facetCounts(songs, filters), [songs, filters]);
  const chords = useMemo(() => chordVocabulary(songs).slice(0, 24), [songs]);
  const active = hasActiveFilters(filters);

  const techniquesByGroup = useMemo(() => {
    const map = new Map<TechniqueGroup, SongTechnique[]>();
    for (const technique of SONG_TECHNIQUES) {
      const group = techniqueGroup(technique);
      map.set(group, [...(map.get(group) ?? []), technique]);
    }
    return [...map.entries()];
  }, []);

  const visibleStyles = useMemo(
    () =>
      [...SONG_STYLES]
        .filter((s) => filters.styles.includes(s) || counts.styles[s])
        .sort((a, b) => (counts.styles[b] ?? 0) - (counts.styles[a] ?? 0)),
    [counts.styles, filters.styles],
  );

  return (
    <div className="mt-6">
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Buscar: Hendrix, bossa, riff, cejilla…"
          aria-label="Buscar canciones"
          className="pl-9"
        />
      </div>

      {/* Nivel */}
      <section aria-labelledby="facet-nivel" className="mt-5">
        <h2
          id="facet-nivel"
          className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          Nivel
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {SONG_LEVELS.map((level) => (
            <FacetButton
              key={level}
              active={filters.levels.includes(level)}
              count={counts.levels[level]}
              onClick={() => apply({ ...filters, levels: toggle(filters.levels, level) })}
            >
              {SONG_LEVEL_LABEL[level]}
            </FacetButton>
          ))}
        </div>
      </section>

      {/* Colecciones */}
      <section aria-labelledby="facet-coleccion" className="mt-5">
        <h2
          id="facet-coleccion"
          className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          Colecciones
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {SONG_COLLECTIONS.map((collection) => (
            <FacetButton
              key={collection}
              active={filters.collections.includes(collection)}
              count={counts.collections[collection]}
              onClick={() =>
                apply({
                  ...filters,
                  collections: toggle(filters.collections, collection),
                })
              }
            >
              {collectionLabel(collection)}
            </FacetButton>
          ))}
        </div>
      </section>

      {!showAllFacets ? (
        <Button
          variant="outline"
          size="sm"
          className="mt-5"
          onClick={() => setShowAllFacets(true)}
        >
          <SlidersHorizontal aria-hidden /> Más filtros: estilo, técnica y acordes
        </Button>
      ) : (
        <>
          <section aria-labelledby="facet-estilo" className="mt-5">
            <h2
              id="facet-estilo"
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Estilo
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {visibleStyles.map((style: SongStyle) => (
                <FacetButton
                  key={style}
                  active={filters.styles.includes(style)}
                  count={counts.styles[style]}
                  onClick={() =>
                    apply({ ...filters, styles: toggle(filters.styles, style) })
                  }
                >
                  {SONG_STYLE_LABEL[style]}
                </FacetButton>
              ))}
            </div>
          </section>

          <section aria-labelledby="facet-tecnica" className="mt-5">
            <h2
              id="facet-tecnica"
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Qué se practica
            </h2>
            {techniquesByGroup.map(([group, techniques]) => {
              const visible = techniques.filter(
                (t) => filters.techniques.includes(t) || counts.techniques[t],
              );
              if (visible.length === 0) return null;
              return (
                <div key={group} className="mt-3">
                  <h3 className="text-xs text-muted-foreground">
                    {TECHNIQUE_GROUP_LABEL[group]}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {visible.map((technique) => (
                      <FacetButton
                        key={technique}
                        active={filters.techniques.includes(technique)}
                        count={counts.techniques[technique]}
                        onClick={() =>
                          apply({
                            ...filters,
                            techniques: toggle(filters.techniques, technique),
                          })
                        }
                      >
                        {techniqueLabel(technique)}
                      </FacetButton>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>

          <section aria-labelledby="facet-acordes" className="mt-5">
            <h2
              id="facet-acordes"
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Acordes que ya sabes
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Marca los que dominas y te dejamos solo lo que puedes tocar entero con
              ellos.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {chords.map(({ chord }) => (
                <FacetButton
                  key={chord}
                  active={filters.knownChords.includes(chord)}
                  count={undefined}
                  onClick={() =>
                    apply({ ...filters, knownChords: toggle(filters.knownChords, chord) })
                  }
                >
                  <span className="font-mono">{chord}</span>
                </FacetButton>
              ))}
            </div>
          </section>
        </>
      )}

      <div className="mt-6 flex items-center gap-3 border-t pt-4">
        <p aria-live="polite" className="text-sm text-muted-foreground">
          <strong className="text-foreground tabular-nums">{results.length}</strong> de{" "}
          {songs.length} canciones
        </p>
        {active && (
          <Button size="sm" variant="ghost" onClick={() => apply(EMPTY_SONG_FILTERS)}>
            <X aria-hidden /> Limpiar filtros
          </Button>
        )}
      </div>

      {/* Portada de colecciones cuando no hay nada filtrado */}
      {!active && (
        <section aria-labelledby="colecciones-destacadas" className="mt-6">
          <h2 id="colecciones-destacadas" className="text-lg font-medium">
            Por dónde empezar
          </h2>
          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SONG_COLLECTIONS.filter((c) => counts.collections[c]).map((collection) => (
              <li key={collection}>
                <button
                  type="button"
                  onClick={() => apply({ ...filters, collections: [collection] })}
                  className={cn(
                    "flex h-full w-full flex-col gap-1 rounded-xl border bg-card p-4 text-left transition-colors",
                    "hover:border-primary/50 hover:bg-secondary",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  )}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-medium">{collectionLabel(collection)}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {counts.collections[collection]}
                    </span>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {collectionTagline(collection)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results.length === 0 ? (
        <p className="mt-10 rounded-lg border p-6 text-center text-sm text-muted-foreground">
          Nada encaja con eso. Quita algún filtro: pedir tres técnicas a la vez suele
          dejar la lista en cero.
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {results.map((song) => (
            <li key={song.slug}>
              <Link
                href={`/canciones/${song.slug}`}
                className={cn(
                  "flex h-full flex-col gap-1.5 rounded-xl border bg-card p-4 transition-colors",
                  "hover:border-primary/50 hover:bg-secondary",
                )}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="font-medium">{song.title}</span>
                  <Badge variant="outline" className="shrink-0">
                    N{song.level}
                  </Badge>
                </span>
                <span className="text-sm text-muted-foreground">
                  {song.artist}
                  {song.year ? ` · ${song.year}` : ""}
                </span>
                <span className="mt-1 flex flex-wrap gap-1.5">
                  <Badge variant="secondary">{SONG_STYLE_LABEL[song.style]}</Badge>
                  <Badge variant="secondary" className="font-mono">
                    {song.key}
                  </Badge>
                  {song.techniques.slice(0, 2).map((technique) => (
                    <Badge key={technique} variant="outline">
                      {techniqueLabel(technique)}
                    </Badge>
                  ))}
                </span>
                <span className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {song.purpose}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export type { SongCollection };
