import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Search, Loader2, Clock, Dumbbell, Building2, Trees } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { searchPlaces, getRecentPlaces, saveRecentPlace, getPlaceTypeLabel } from '../lib/geocoding';
import { cn } from '../lib/utils';

function HighlightMatch({ text, query }) {
  if (!text || !query || query.length < 2) return text;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/25 text-primary rounded-sm px-0.5 not-italic">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function PlaceIcon({ type }) {
  const iconClass = 'shrink-0';
  if (['sports_centre', 'pitch', 'stadium'].includes(type)) {
    return <Dumbbell size={16} className={cn(iconClass, 'text-primary')} />;
  }
  if (['park', 'garden'].includes(type)) {
    return <Trees size={16} className={cn(iconClass, 'text-emerald-400')} />;
  }
  if (['school', 'university', 'building'].includes(type)) {
    return <Building2 size={16} className={cn(iconClass, 'text-sky-400')} />;
  }
  return <MapPin size={16} className={cn(iconClass, 'text-blue-400')} />;
}

function ResultRow({ place, query, isActive, isRecent, onSelect, onMouseEnter }) {
  const typeLabel = getPlaceTypeLabel(place.type);

  return (
    <li
      role="option"
      aria-selected={isActive}
      onMouseEnter={onMouseEnter}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onSelect(place)}
      className={cn(
        'flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors',
        isActive ? 'bg-primary/15' : 'hover:bg-white/8'
      )}
    >
      <div className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
        isRecent ? 'bg-zinc-800' : 'bg-white/5'
      )}>
        {isRecent ? <Clock size={15} className="text-zinc-400" /> : <PlaceIcon type={place.type} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-[15px] leading-snug truncate">
          <HighlightMatch text={place.name} query={query} />
        </p>
        {(place.subtitle || typeLabel) && (
          <p className="text-zinc-500 text-xs mt-0.5 truncate">
            {typeLabel && <span className="text-zinc-600">{typeLabel} · </span>}
            {place.subtitle}
          </p>
        )}
      </div>
    </li>
  );
}

export default function LocationAutocomplete({ value, onChange, bias }) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [recent, setRecent] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const justSelectedRef = useRef(false);

  const displayItems = query.length >= 2 ? results : recent;
  const showRecent = query.length < 2 && recent.length > 0;
  const showResults = query.length >= 2 && (results.length > 0 || isSearching);
  const showEmpty = query.length >= 2 && !isSearching && results.length === 0;
  const showCustom = query.length >= 2 && !isSearching;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value && value !== query && !justSelectedRef.current) {
      setQuery(value);
    }
  }, [value, query]);

  useEffect(() => {
    if (!showDropdown) return;

    if (query.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsSearching(true);
    setActiveIndex(-1);

    const timer = setTimeout(async () => {
      try {
        const places = await searchPlaces(query, { signal: controller.signal, bias });
        if (!controller.signal.aborted) {
          setResults(places);
          setShowDropdown(true);
        }
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Geocoding error:', err);
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, showDropdown, bias]);

  const handleSelect = useCallback((place) => {
    justSelectedRef.current = true;
    const name = place.subtitle ? `${place.name}, ${place.subtitle.split(',')[0]?.trim()}` : place.name;
    const displayName = place.name;
    setQuery(displayName);
    setShowDropdown(false);
    setActiveIndex(-1);
    saveRecentPlace(place);
    setRecent(getRecentPlaces());
    onChange({
      name: displayName,
      lat: place.lat ?? null,
      lng: place.lng ?? null,
    });
  }, [onChange]);

  const handleCustom = useCallback(() => {
    setShowDropdown(false);
    setActiveIndex(-1);
    onChange({ name: query.trim(), lat: null, lng: null });
  }, [query, onChange]);

  const handleFocus = () => {
    setRecent(getRecentPlaces());
    setShowDropdown(true);
  };

  const handleKeyDown = (e) => {
    const customOffset = showCustom ? 1 : 0;
    const total = displayItems.length + customOffset;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!showDropdown) setShowDropdown(true);
      setActiveIndex((i) => (i + 1) % Math.max(total, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? total - 1 : i - 1));
    } else if (e.key === 'Enter') {
      if (showDropdown && activeIndex >= 0) {
        e.preventDefault();
        if (activeIndex < displayItems.length) {
          handleSelect(displayItems[activeIndex]);
        } else if (showCustom) {
          handleCustom();
        }
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  };

  const open = showDropdown && (showRecent || showResults || showEmpty || showCustom);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="block text-[11px] font-bold text-zinc-400 mb-2 uppercase tracking-widest pl-1">
        Lieu / Terrain *
      </label>
      <div className="relative group">
        <input
          ref={inputRef}
          type="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          required
          value={query}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);
            setShowDropdown(true);
            if (v === '') onChange(null);
          }}
          onFocus={handleFocus}
          onBlur={() => {
            setTimeout(() => {
              if (justSelectedRef.current) {
                justSelectedRef.current = false;
                return;
              }
              if (query.trim()) {
                onChange({ name: query.trim(), lat: null, lng: null });
              }
            }, 200);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Chercher un terrain, quartier, ville..."
          className="w-full p-4 pl-12 pr-12 bg-[#1a1a1c] border border-white/10 rounded-2xl text-base text-white outline-none focus:border-primary/40 focus:bg-[#222225] focus:ring-1 focus:ring-primary/20 transition-all font-sans shadow-inner placeholder:text-zinc-600"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors pointer-events-none">
          {isSearching ? <Loader2 size={18} className="animate-spin text-primary" /> : <Search size={18} />}
        </div>
        {query.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              onChange(null);
              setResults([]);
              setShowDropdown(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white bg-white/10 rounded-full transition-colors touch-target"
            aria-label="Effacer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-[2000] w-full mt-2 bg-[#141416]/98 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl"
            role="listbox"
          >
            <div className="max-h-[min(50vh,340px)] overflow-y-auto overscroll-contain">
              {showRecent && (
                <>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-600">Récents</p>
                  <ul>
                    {recent.map((place, i) => (
                      <ResultRow
                        key={`recent-${place.name}-${i}`}
                        place={place}
                        query=""
                        isActive={activeIndex === i}
                        isRecent
                        onSelect={handleSelect}
                        onMouseEnter={() => setActiveIndex(i)}
                      />
                    ))}
                  </ul>
                </>
              )}

              {showRecent && showResults && <div className="h-px bg-white/5 mx-3" />}

              {isSearching && results.length === 0 && (
                <ul className="py-2">
                  {[1, 2, 3].map((i) => (
                    <li key={i} className="flex items-center gap-3 px-3 py-3">
                      <div className="w-9 h-9 rounded-xl skeleton-loader shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-3/4 skeleton-loader rounded" />
                        <div className="h-2.5 w-1/2 skeleton-loader rounded" />
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {results.length > 0 && (
                <ul>
                  {results.map((place, i) => (
                    <ResultRow
                      key={place.id}
                      place={place}
                      query={query}
                      isActive={activeIndex === i}
                      onSelect={handleSelect}
                      onMouseEnter={() => setActiveIndex(i)}
                    />
                  ))}
                </ul>
              )}

              {showEmpty && (
                <p className="px-4 py-4 text-center text-zinc-500 text-sm">
                  Aucun lieu trouvé — utilise l&apos;adresse libre ci-dessous
                </p>
              )}

              {showCustom && (
                <>
                  <div className="h-px bg-white/5 mx-3" />
                  <ul>
                    <ResultRow
                      place={{ name: `Utiliser « ${query.trim()} »`, subtitle: 'Adresse libre / sans repère carte', type: 'custom' }}
                      query=""
                      isActive={activeIndex === displayItems.length}
                      onSelect={() => handleCustom()}
                      onMouseEnter={() => setActiveIndex(displayItems.length)}
                    />
                  </ul>
                </>
              )}
            </div>

            <div className="px-3 py-2 border-t border-white/5 bg-black/30">
              <p className="text-[10px] text-zinc-600 text-center">
                Propulsé par OpenStreetMap · Résultats priorisés Afrique de l&apos;Ouest
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
