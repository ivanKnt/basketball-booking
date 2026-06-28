import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { Layers } from 'lucide-react';
import { MAP_STYLES, DEFAULT_CENTER, DEFAULT_ZOOM, coordsToLatLng } from '../lib/mapStyles';
import { courtMarkerIcon } from '../lib/mapIcons';
import { cn } from '../lib/utils';
import '../lib/mapIcons';

function FlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1 });
    }
  }, [center, zoom, map]);
  return null;
}

function MapClickHandler({ onClick, enabled }) {
  useMapEvents({
    click(e) {
      if (enabled) onClick?.(e.latlng);
    },
  });
  return null;
}

function ResizeFix() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export default function CourtMap({
  coordinates,
  center: centerProp,
  zoom = DEFAULT_ZOOM,
  interactive = false,
  onPositionChange,
  showStylePicker = true,
  className,
  hint,
}) {
  const [styleId, setStyleId] = useState('dark');
  const [pickerOpen, setPickerOpen] = useState(false);
  const style = MAP_STYLES[styleId];

  const position = useMemo(() => {
    if (coordinates) return coordsToLatLng(coordinates);
    if (centerProp) return Array.isArray(centerProp) ? centerProp : coordsToLatLng(centerProp);
    return null;
  }, [coordinates, centerProp]);

  const mapCenter = position || centerProp || DEFAULT_CENTER;
  const mapZoom = position ? Math.max(zoom, 15) : zoom;

  return (
    <div className={cn('court-map-wrapper relative rounded-2xl overflow-hidden border border-white/10', className)}>
      {showStylePicker && (
        <div className="absolute top-3 right-3 z-[1000] flex flex-col items-end gap-1.5">
          <button
            type="button"
            onClick={() => setPickerOpen(!pickerOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-zinc-300 text-[11px] font-medium hover:text-white transition-colors touch-target"
            aria-label="Changer le style de carte"
          >
            <Layers size={13} />
            <span className="hidden sm:inline">{style.label}</span>
          </button>
          {pickerOpen && (
            <div className="flex flex-col gap-1 p-1 rounded-xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl min-w-[120px]">
              {Object.values(MAP_STYLES).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { setStyleId(s.id); setPickerOpen(false); }}
                  className={cn(
                    'px-3 py-2 rounded-lg text-left text-xs font-medium transition-colors touch-target',
                    styleId === s.id ? 'bg-primary/20 text-primary' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {hint && (
        <div className="absolute bottom-3 left-3 right-14 z-[1000] pointer-events-none">
          <p className="text-[10px] text-white/80 bg-black/60 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-white/10 inline-block">
            {hint}
          </p>
        </div>
      )}

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={interactive}
        dragging
        touchZoom
        doubleClickZoom={interactive}
        className="court-map-container h-full w-full"
        style={{ minHeight: 'inherit', height: '100%' }}
      >
        <TileLayer url={style.url} attribution={style.attribution} maxZoom={style.maxZoom} />
        {position && <Marker position={position} icon={courtMarkerIcon} />}
        <FlyTo center={position || mapCenter} zoom={mapZoom} />
        <ResizeFix />
        {interactive && <MapClickHandler enabled onClick={onPositionChange} />}
      </MapContainer>
    </div>
  );
}
