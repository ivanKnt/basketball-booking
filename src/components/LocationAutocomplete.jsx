import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';

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
    <div className="relative" ref={dropdownRef}>
      <label className="block text-[10px] font-bold text-zinc-400 mb-2 uppercase tracking-widest pl-1">
        Lieu / Terrain *
      </label>
      <div className="relative">
        <input 
          type="text" 
          required
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value === '') {
              onChange(null); // Clear parent value
            } else {
              // Allow custom names if it's not in the map API
              onChange({ name: e.target.value, lat: null, lng: null });
            }
          }}
          onFocus={() => {
            if (results.length > 0) setShowDropdown(true);
          }}
          placeholder="Ex: Terrain de Mermoz, Dakar"
          className="w-full p-4 pl-12 bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-display"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
          {isSearching ? <Loader2 size={20} className="animate-spin text-primary" /> : <Search size={20} />}
        </div>
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-[#121214] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
          <ul>
            {results.map((place) => (
              <li 
                key={place.place_id}
                onClick={() => handleSelect(place)}
                className="flex items-start gap-3 p-4 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-0"
              >
                <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-white font-medium">{place.display_name.split(',')[0]}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">{place.display_name.split(',').slice(1).join(',').substring(0, 60)}...</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
