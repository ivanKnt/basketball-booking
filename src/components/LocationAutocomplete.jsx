import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function LocationAutocomplete({ value, onChange }) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Sync external value
    if (value && value !== query) {
      setQuery(value);
    }
  }, [value]);

  useEffect(() => {
    const searchPlaces = async () => {
      if (!query || query.length < 3) {
        setResults([]);
        return;
      }
      
      // Don't search if the query perfectly matches the current selected value
      if (query === value) return;

      setIsSearching(true);
      try {
        // OpenStreetMap Nominatim API (Free, no API key required)
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`);
        const data = await res.json();
        setResults(data);
        setShowDropdown(true);
      } catch (err) {
        console.error("Error fetching location", err);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchPlaces, 500); // 500ms debounce
    return () => clearTimeout(timeoutId);
  }, [query, value]);

  const handleSelect = (place) => {
    const formattedName = place.display_name.split(',').slice(0, 3).join(','); // Keep it readable
    setQuery(formattedName);
    setShowDropdown(false);
    onChange({ name: formattedName, lat: parseFloat(place.lat), lng: parseFloat(place.lon) }); // Send full data
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="block text-[11px] font-bold text-zinc-400 mb-2 uppercase tracking-widest pl-1">
        Lieu / Terrain *
      </label>
      <div className="relative group">
        <input 
          type="text" 
          required
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value === '') {
              onChange(null);
            } else {
              onChange({ name: e.target.value, lat: null, lng: null });
            }
          }}
          onFocus={() => {
            if (query.length > 0) setShowDropdown(true);
          }}
          placeholder="Ex: Terrain de Mermoz..."
          className="w-full p-4 pl-12 bg-[#1a1a1c] border border-white/10 rounded-2xl text-white outline-none focus:border-white/30 focus:bg-[#222225] transition-all font-sans shadow-inner placeholder:text-zinc-600"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors">
          {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
        </div>
        {query.length > 0 && (
          <button 
            type="button"
            onClick={() => { setQuery(''); onChange(null); setResults([]); setShowDropdown(false); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white bg-white/10 rounded-full p-1 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && query.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-50 w-full mt-2 bg-[#1c1c1e]/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl"
          >
            <ul className="py-2">
              {results.length > 0 ? (
                results.map((place) => (
                  <li 
                    key={place.place_id}
                    onClick={() => handleSelect(place)}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                      <MapPin size={16} className="text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-[15px] truncate">{place.display_name.split(',')[0]}</p>
                      <p className="text-zinc-500 text-xs mt-0.5 truncate">{place.display_name.split(',').slice(1).join(',').trim()}</p>
                    </div>
                  </li>
                ))
              ) : (
                !isSearching && query.length >= 3 && (
                  <li className="px-4 py-6 text-center">
                    <p className="text-zinc-400 text-sm mb-1">Aucun résultat trouvé sur la carte.</p>
                  </li>
                )
              )}
              
              {/* Fallback Custom Option */}
              <div className="h-px w-full bg-white/5 my-1"></div>
              <li 
                onClick={() => {
                  setShowDropdown(false);
                  onChange({ name: query, lat: null, lng: null });
                }}
                className="flex items-center gap-4 px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Search size={16} className="text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-[15px] truncate">Utiliser "{query}"</p>
                  <p className="text-emerald-500/70 text-xs mt-0.5">Adresse libre / personnalisée</p>
                </div>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
