'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import { Dices, History, Loader2, MapPin, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { countryName, featureTypeLabel, flagEmoji } from '@/lib/countries';
import type {
  DestinationPreset,
  DestinationSuggestion,
  ResolvedDestination,
} from '@/lib/schemas/destination';

/**
 * Destination picker.
 *
 * Two things it does that the previous version could not:
 *
 *   1. Before you type, it shows somewhere to go — your recent destinations and
 *      a curated photo grid — instead of an empty dropdown. This is the first
 *      field of the only flow in the app, so a blank box was a wasted moment.
 *
 *   2. While you type, each row carries a flag, a region and a type badge, so
 *      the three Cambridges are told apart at a glance. The old Photon-backed
 *      version had nothing but a name and coordinates to render.
 *
 * Mapbox session-token mechanics: one token spans all the keystrokes of a
 * single search and is rotated after a selection, because Mapbox bills a
 * session rather than a request. Getting this wrong would bill every keystroke
 * separately, so the rotation is deliberate and commented at the call site.
 *
 * The ARIA combobox behaviour (arrow keys, Enter, Escape, aria-activedescendant)
 * is carried over unchanged — it was correct and must not regress.
 */

const DEBOUNCE_MS = 250;

type Props = {
  value: ResolvedDestination | null;
  onSelect: (destination: ResolvedDestination | null) => void;
  popular: DestinationPreset[];
  recent: ResolvedDestination[];
  error?: string;
};

export function DestinationSearch({ value, onSelect, popular, recent, error }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DestinationSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputId = useId();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // One Mapbox billing session per search interaction.
  const sessionRef = useRef<string>(crypto.randomUUID());

  const search = useCallback(async (term: string) => {
    abortRef.current?.abort();

    if (term.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    try {
      const response = await fetch(
        `/api/places/search?q=${encodeURIComponent(term)}&session=${sessionRef.current}`,
        { signal: controller.signal },
      );
      if (!response.ok) throw new Error(String(response.status));

      const data: { results?: DestinationSuggestion[] } = await response.json();
      setResults(data.results ?? []);
      setActiveIndex(-1);
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') setResults([]);
    } finally {
      // A superseded request must not clear the newer request's spinner.
      if (abortRef.current === controller) setLoading(false);
    }
  }, []);

  // Debounce keystrokes so typing "Barcelona" is a few requests, not nine.
  useEffect(() => {
    if (value && query === value.label) return;

    const timer = setTimeout(() => void search(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, search, value]);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Close when a click lands outside the component.
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  /** Commits an already-resolved destination — presets need no Mapbox call. */
  function commit(destination: ResolvedDestination) {
    onSelect(destination);
    setQuery(destination.label);
    setResults([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  /** Resolves a suggestion to coordinates, then commits it. */
  async function choose(suggestion: DestinationSuggestion) {
    setResolving(true);
    setOpen(false);

    try {
      const response = await fetch(
        `/api/places/retrieve?id=${encodeURIComponent(suggestion.mapboxId)}&session=${sessionRef.current}`,
      );
      if (!response.ok) throw new Error(String(response.status));

      const data: { result?: ResolvedDestination } = await response.json();
      if (!data.result) throw new Error('empty');

      commit(data.result);
    } catch {
      setOpen(true);
      onSelect(null);
    } finally {
      setResolving(false);
      // A retrieve ends the Mapbox session; the next search starts a new one.
      sessionRef.current = crypto.randomUUID();
    }
  }

  function clear() {
    onSelect(null);
    setQuery('');
    setResults([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  function surpriseMe() {
    if (popular.length === 0) return;
    const index = Math.floor(Math.random() * popular.length);
    const pick = popular[index]!;
    commit(pick);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open && results.length > 0) {
        setOpen(true);
        return;
      }
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((current) => {
        const next = current + delta;
        if (next < 0) return results.length - 1;
        if (next >= results.length) return 0;
        return next;
      });
      return;
    }

    if (event.key === 'Enter' && open && activeIndex >= 0) {
      event.preventDefault();
      const suggestion = results[activeIndex];
      if (suggestion) void choose(suggestion);
      return;
    }

    if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const isSearching = query.trim().length >= 2;
  const activeId = activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined;
  const showResults = open && isSearching;
  const showPresets = open && !isSearching && !value;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden="true"
        />

        <Input
          id={inputId}
          role="combobox"
          aria-expanded={showResults}
          aria-controls={showResults ? listboxId : undefined}
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          autoComplete="off"
          placeholder="Search a city or region…"
          className="pr-9 pl-9"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            if (value) onSelect(null);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />

        {loading || resolving ? (
          <Loader2
            className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin"
            aria-hidden="true"
          />
        ) : query ? (
          <button
            type="button"
            onClick={clear}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 focus-visible:ring-2"
            aria-label="Clear destination"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {error ? (
        <p id={`${inputId}-error`} role="alert" className="text-destructive mt-2 text-sm">
          {error}
        </p>
      ) : null}

      {/* Selected state: a compact confirmation line. */}
      {value && !open ? (
        <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-sm">
          <span aria-hidden="true">{flagEmoji(value.countryCode)}</span>
          Planning a trip to <span className="text-foreground font-medium">{value.name}</span>
        </p>
      ) : null}

      {/* --- Search results ------------------------------------------------ */}
      {showResults ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Destination suggestions"
          className="bg-popover absolute z-30 mt-2 max-h-80 w-full overflow-auto rounded-lg border p-1 shadow-lg"
        >
          {results.length === 0 ? (
            <li className="text-muted-foreground px-3 py-6 text-center text-sm">
              {loading ? 'Searching…' : 'No places found. Try a different spelling.'}
            </li>
          ) : (
            results.map((suggestion, index) => {
              const flag = flagEmoji(suggestion.countryCode);
              const badge = featureTypeLabel(suggestion.featureType);

              return (
                <li
                  key={suggestion.mapboxId}
                  id={`${listboxId}-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5',
                    index === activeIndex && 'bg-secondary',
                  )}
                  // Pointer selection is a convenience layer over the keyboard
                  // interaction handled on the input, which owns the ARIA state.
                  onPointerDown={(event) => {
                    event.preventDefault();
                    void choose(suggestion);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <span className="w-6 shrink-0 text-center text-lg" aria-hidden="true">
                    {flag || <MapPin className="text-muted-foreground inline size-4" />}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{suggestion.name}</span>
                      {badge ? (
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          {badge}
                        </Badge>
                      ) : null}
                    </span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {suggestion.context || countryName(suggestion.countryCode)}
                    </span>
                  </span>
                </li>
              );
            })
          )}
        </ul>
      ) : null}

      {/* --- Empty state: recent + curated --------------------------------- */}
      {showPresets ? (
        <div className="bg-popover absolute z-30 mt-2 max-h-[26rem] w-full overflow-auto rounded-lg border p-3 shadow-lg">
          {recent.length > 0 ? (
            <section className="mb-4">
              <h3 className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
                <History className="size-3" aria-hidden="true" /> Recent
              </h3>
              <ul className="flex flex-wrap gap-2">
                {recent.map((destination) => (
                  <li key={destination.label}>
                    <button
                      type="button"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        commit(destination);
                      }}
                      className="bg-secondary hover:bg-secondary/70 focus-visible:ring-ring rounded-full px-3 py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-offset-2"
                    >
                      {destination.name}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Popular right now
            </h3>
            <button
              type="button"
              onPointerDown={(event) => {
                event.preventDefault();
                surpriseMe();
              }}
              className="text-primary hover:text-primary/80 focus-visible:ring-ring flex items-center gap-1 rounded text-xs font-medium focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <Dices className="size-3.5" aria-hidden="true" /> Surprise me
            </button>
          </div>

          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {popular.map((destination) => (
              <li key={destination.label}>
                <button
                  type="button"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    commit(destination);
                  }}
                  className="group focus-visible:ring-ring relative block h-24 w-full overflow-hidden rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  {destination.imageUrl ? (
                    <Image
                      src={destination.imageUrl}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 50vw, 180px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span className="placeholder-gradient absolute inset-0" aria-hidden="true" />
                  )}

                  {/* Scrim keeps the label legible over any photograph. */}
                  <span
                    className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
                    aria-hidden="true"
                  />

                  <span className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 p-2 text-left">
                    <span aria-hidden="true">{flagEmoji(destination.countryCode)}</span>
                    <span className="truncate text-sm font-semibold text-white">
                      {destination.name}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-muted-foreground mt-2 text-xs">
        Search by Mapbox · Photos from Wikimedia Commons
      </p>
    </div>
  );
}
