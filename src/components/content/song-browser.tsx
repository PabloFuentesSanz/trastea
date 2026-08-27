"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Search, X } from "lucide-react";
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

/** Resultados por tanda: 304 tarjetas de golpe hacían una página de 60.000 px. */
const PAGE_SIZE = 48;

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

type FacetId = "coleccion" | "estilo" | "tecnica" | "acordes";

const FACET_LABEL: Record<FacetId, string> = {
  coleccion: "Colecciones",
  estilo: "Estilo",
  tecnica: "Qué se practica",
  acordes: "Acordes que sabes",
};

/** Chip de un filtro puesto, con su aspa para quitarlo. */
function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Quitar filtro ${label}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-primary/50 bg-accent px-2.5 py-0.5 text-xs",
        "hover:border-primary hover:bg-secondary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      {label}
      <X className="size-3" aria-hidden />
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

  /** Una faceta abierta a la vez: el problema era tenerlas todas desplegadas. */
  const [openFacet, setOpenFacet] = useState<FacetId | null>(null);
  const [facetQuery, setFacetQuery] = useState("");
  const [shown, setShown] = useState(PAGE_SIZE);

  const results = useMemo(() => filterSongs(songs, filters), [songs, filters]);
  const counts = useMemo(() => facetCounts(songs, filters), [songs, filters]);
  const chords = useMemo(() => chordVocabulary(songs).slice(0, 40), [songs]);
  const active = hasActiveFilters(filters);

  // Al cambiar los filtros se vuelve al principio de la lista.
  const [lastQuery, setLastQuery] = useState(searchParams.toString());
  if (lastQuery !== searchParams.toString()) {
    setLastQuery(searchParams.toString());
    setShown(PAGE_SIZE);
  }

  const openPanel = (facet: FacetId) => {
    setOpenFacet((current) => (current === facet ? null : facet));
    setFacetQuery("");
  };

  const matches = (label: string) =>
    facetQuery.trim() === "" ||
    label.toLowerCase().includes(facetQuery.trim().toLowerCase());

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

  /** Cuántos filtros hay puestos en cada faceta, para el botón. */
  const activeCount: Record<FacetId, number> = {
    coleccion: filters.collections.length,
    estilo: filters.styles.length,
    tecnica: filters.techniques.length,
    acordes: filters.knownChords.length,
  };

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [
    ...filters.levels.map((level) => ({
      key: `n${level}`,
      label: SONG_LEVEL_LABEL[level],
      onRemove: () => apply({ ...filters, levels: toggle(filters.levels, level) }),
    })),
    ...filters.collections.map((collection) => ({
      key: `c${collection}`,
      label: collectionLabel(collection),
      onRemove: () =>
        apply({ ...filters, collections: toggle(filters.collections, collection) }),
    })),
    ...filters.styles.map((style) => ({
      key: `e${style}`,
      label: SONG_STYLE_LABEL[style],
      onRemove: () => apply({ ...filters, styles: toggle(filters.styles, style) }),
    })),
    ...filters.techniques.map((technique) => ({
      key: `t${technique}`,
      label: techniqueLabel(technique),
      onRemove: () =>
        apply({ ...filters, techniques: toggle(filters.techniques, technique) }),
    })),
    ...filters.knownChords.map((chord) => ({
      key: `a${chord}`,
      label: chord,
      onRemove: () =>
        apply({ ...filters, knownChords: toggle(filters.knownChords, chord) }),
    })),
  ];

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

      {/* Nivel: cinco opciones, siempre a mano */}
      <section aria-labelledby="facet-nivel" className="mt-4">
        <h2 id="facet-nivel" className="sr-only">
          Nivel
        </h2>
        <div className="flex flex-wrap gap-2">
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

      {/* El resto de facetas, plegadas: se abre una cada vez */}
      <div className="mt-3 flex flex-wrap gap-2">
        {(Object.keys(FACET_LABEL) as FacetId[]).map((facet) => (
          <button
            key={facet}
            type="button"
            aria-expanded={openFacet === facet}
            onClick={() => openPanel(facet)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              openFacet === facet
                ? "border-primary bg-accent"
                : "bg-card hover:border-primary/50 hover:bg-secondary",
            )}
          >
            {FACET_LABEL[facet]}
            {activeCount[facet] > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-xs tabular-nums text-primary-foreground">
                {activeCount[facet]}
              </span>
            )}
            <ChevronDown
              aria-hidden
              className={cn(
                "size-4 text-muted-foreground transition-transform",
                openFacet === facet && "rotate-180",
              )}
            />
          </button>
        ))}
      </div>

      {openFacet && (
        <section
          aria-label={FACET_LABEL[openFacet]}
          className="mt-3 rounded-xl border bg-card p-3"
        >
          {(openFacet === "tecnica" ||
            openFacet === "estilo" ||
            openFacet === "coleccion") && (
            <div className="relative mb-3">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                value={facetQuery}
                onChange={(e) => setFacetQuery(e.target.value)}
                placeholder={`Buscar en ${FACET_LABEL[openFacet].toLowerCase()}…`}
                aria-label={`Buscar en ${FACET_LABEL[openFacet]}`}
                className="h-9 pl-9"
              />
            </div>
          )}

          {openFacet === "coleccion" && (
            <div className="flex flex-wrap gap-2">
              {SONG_COLLECTIONS.filter((c) => matches(collectionLabel(c))).map(
                (collection) => (
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
                ),
              )}
            </div>
          )}

          {openFacet === "estilo" && (
            <div className="flex flex-wrap gap-2">
              {visibleStyles
                .filter((s) => matches(SONG_STYLE_LABEL[s]))
                .map((style: SongStyle) => (
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
          )}

          {openFacet === "tecnica" &&
            techniquesByGroup.map(([group, techniques]) => {
              const visible = techniques.filter(
                (t) =>
                  (filters.techniques.includes(t) || counts.techniques[t]) &&
                  matches(techniqueLabel(t)),
              );
              if (visible.length === 0) return null;
              return (
                <div key={group} className="mb-3 last:mb-0">
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

          {openFacet === "acordes" && (
            <>
              <p className="mb-2 text-sm text-muted-foreground">
                Marca los que dominas y te dejamos solo lo que puedes tocar entero con
                ellos.
              </p>
              <div className="flex flex-wrap gap-2">
                {chords.map(({ chord }) => (
                  <FacetButton
                    key={chord}
                    active={filters.knownChords.includes(chord)}
                    count={undefined}
                    onClick={() =>
                      apply({
                        ...filters,
                        knownChords: toggle(filters.knownChords, chord),
                      })
                    }
                  >
                    <span className="font-mono">{chord}</span>
                  </FacetButton>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* Barra pegajosa: el recuento y lo que hay puesto, siempre a la vista */}
      <div className="sticky top-0 z-20 mt-4 border-y bg-background/95 py-2 backdrop-blur md:top-14">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <p aria-live="polite" className="text-sm text-muted-foreground">
            <strong className="text-foreground tabular-nums">{results.length}</strong> de{" "}
            {songs.length} canciones
          </p>
          {activeChips.map((chip) => (
            <ActiveChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
          ))}
          {active && (
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto"
              onClick={() => apply(EMPTY_SONG_FILTERS)}
            >
              <X aria-hidden /> Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Portada de colecciones cuando no hay nada filtrado */}
      {!active && (
        <section aria-labelledby="colecciones-destacadas" className="mt-6">
          <h2 id="colecciones-destacadas" className="text-lg font-medium">
            Por dónde empezar
          </h2>
          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SONG_COLLECTIONS.filter((c) => counts.collections[c])
              .slice(0, 6)
              .map((collection) => (
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
        <>
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {results.slice(0, shown).map((song) => (
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

          {shown < results.length && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={() => setShown((n) => n + PAGE_SIZE)}>
                Ver más ({results.length - shown} restantes)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export type { SongCollection };
