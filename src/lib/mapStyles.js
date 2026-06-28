/**
 * Free map tile providers — no API keys required.
 * All based on OpenStreetMap data via well-known open-source projects.
 *
 * | Style    | Provider              | Best for              |
 * |----------|-----------------------|-----------------------|
 * | dark     | CARTO Dark Matter     | Night app aesthetic   |
 * | streets  | CARTO Voyager         | Clean street detail   |
 * | outdoors | OpenTopoMap           | Parks, outdoor courts |
 * | satellite| Esri World Imagery  | Aerial court photos   |
 */
export const MAP_STYLES = {
  dark: {
    id: 'dark',
    label: 'Nuit',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
  },
  streets: {
    id: 'streets',
    label: 'Rues',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
  },
  outdoors: {
    id: 'outdoors',
    label: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    maxZoom: 17,
  },
  satellite: {
    id: 'satellite',
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; <a href="https://www.esri.com/">Esri</a>',
    maxZoom: 19,
  },
};

export const DEFAULT_CENTER = [14.6928, -17.4467]; // Dakar, Senegal
export const DEFAULT_ZOOM = 13;

export function coordsToLatLng(coords) {
  if (!coords) return null;
  return [coords.lat, coords.lng];
}

export function getDirectionsUrl(coords, locationName) {
  if (coords?.lat != null && coords?.lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(locationName || '')}`;
}
