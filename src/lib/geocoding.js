import { DEFAULT_CENTER } from './mapStyles';

const PHOTON_URL = 'https://photon.komoot.io/api/';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const RECENT_KEY = 'hoopshare-recent-places';
const MAX_RECENT = 5;

/** West Africa bounding box — prioritises Lomé, Dakar, Abidjan, etc. */
const WEST_AFRICA_BBOX = '-17.5,4.0,16.5,25.0';

export function getRecentPlaces() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveRecentPlace(place) {
  if (!place?.name) return;
  const recent = getRecentPlaces().filter((p) => p.name !== place.name);
  recent.unshift({
    name: place.name,
    subtitle: place.subtitle || '',
    lat: place.lat,
    lng: place.lng,
  });
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

function formatPhotonFeature(feature) {
  const p = feature.properties;
  const [lng, lat] = feature.geometry.coordinates;
  const title = p.name || p.street || p.city || 'Lieu';
  const parts = [p.street, p.housenumber, p.district, p.city, p.state, p.country].filter(Boolean);
  const subtitle = [...new Set(parts)].join(', ');
  const type = p.osm_value || p.type || 'place';

  return {
    id: `photon-${feature.properties.osm_id || `${lat}-${lng}`}`,
    name: title,
    subtitle,
    lat,
    lng,
    type,
    source: 'photon',
  };
}

function formatNominatimResult(item) {
  const parts = item.display_name.split(',');
  return {
    id: `nominatim-${item.place_id}`,
    name: parts[0]?.trim() || item.display_name,
    subtitle: parts.slice(1).join(',').trim(),
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    type: item.type || item.class || 'place',
    source: 'nominatim',
  };
}

async function searchPhoton(query, signal, bias) {
  const params = new URLSearchParams({
    q: query,
    limit: '8',
    lang: 'fr',
    lat: String(bias.lat),
    lon: String(bias.lng),
    bbox: WEST_AFRICA_BBOX,
  });

  const res = await fetch(`${PHOTON_URL}?${params}`, { signal });
  if (!res.ok) throw new Error('Photon error');
  const data = await res.json();
  return (data.features || []).map(formatPhotonFeature);
}

async function searchNominatim(query, signal) {
  const params = new URLSearchParams({
    format: 'json',
    q: query,
    limit: '5',
    addressdetails: '1',
    'accept-language': 'fr',
    viewbox: '-17.5,25.0,16.5,4.0',
    bounded: '0',
  });

  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    signal,
    headers: { 'Accept-Language': 'fr', 'User-Agent': 'HoopShare/1.0' },
  });
  if (!res.ok) throw new Error('Nominatim error');
  const data = await res.json();
  return data.map(formatNominatimResult);
}

function dedupeResults(results) {
  const seen = new Set();
  return results.filter((r) => {
    const key = `${r.name.toLowerCase()}|${r.lat?.toFixed(3)}|${r.lng?.toFixed(3)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Fast place search — Photon first (Komoot, OSM-based), Nominatim fallback.
 */
export async function searchPlaces(query, { signal, bias = { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] } } = {}) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  try {
    const photonResults = await searchPhoton(trimmed, signal, bias);
    if (photonResults.length >= 3) return photonResults;

    // Merge with Nominatim when Photon has few hits (rural areas, local names)
    try {
      const nominatimResults = await searchNominatim(trimmed, signal);
      return dedupeResults([...photonResults, ...nominatimResults]).slice(0, 8);
    } catch {
      return photonResults;
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    // Photon failed — try Nominatim alone
    return searchNominatim(trimmed, signal);
  }
}

export function getPlaceTypeLabel(type) {
  const labels = {
    sports_centre: 'Complexe sportif',
    pitch: 'Terrain',
    stadium: 'Stade',
    park: 'Parc',
    school: 'École',
    university: 'Université',
    restaurant: 'Restaurant',
    cafe: 'Café',
    house: 'Adresse',
    street: 'Rue',
    locality: 'Quartier',
    city: 'Ville',
  };
  return labels[type] || null;
}
