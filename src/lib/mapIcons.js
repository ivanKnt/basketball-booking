import L from 'leaflet';

// Branded orange pin — replaces default Leaflet blue marker
const pinSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z"
    fill="#ff4d00" filter="url(#glow)"/>
  <circle cx="18" cy="17" r="8" fill="#1a1a1c" stroke="#fff" stroke-width="1.5"/>
  <circle cx="18" cy="17" r="4" fill="#ff4d00"/>
</svg>`;

export const courtMarkerIcon = L.divIcon({
  className: 'court-map-marker',
  html: pinSvg,
  iconSize: [36, 48],
  iconAnchor: [18, 48],
  popupAnchor: [0, -44],
});

// Fix default Leaflet asset paths (Vite bundling)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
