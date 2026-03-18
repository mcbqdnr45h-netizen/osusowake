import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Store } from '@workspace/api-client-react';
import { getCategoryIcon } from './BagCard';

// Fix for default marker icons in React-Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom Store Marker Icon
const createCustomIcon = (category: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="w-10 h-10 bg-primary text-primary-foreground rounded-full border-2 border-white shadow-lg flex items-center justify-center text-lg shadow-primary/40 transform transition-transform hover:scale-110">${getCategoryIcon(category)}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

interface MapViewProps {
  stores: Store[];
  center?: [number, number];
  zoom?: number;
}

// Helper to update map center dynamically
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export function MapView({ stores, center = [35.6895, 139.6917], zoom = 13 }: MapViewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-full h-full bg-muted animate-pulse rounded-2xl" />;

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-inner border border-border/50 relative z-0">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <ChangeView center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />
        {stores.map((store) => (
          <Marker 
            key={store.id} 
            position={[store.lat, store.lng]}
            icon={createCustomIcon(store.category)}
          >
            <Popup className="custom-popup">
              <div className="p-1 min-w-[150px]">
                <div className="font-bold text-foreground text-sm mb-1">{store.name}</div>
                <div className="text-xs text-muted-foreground mb-2">{store.address}</div>
                <div className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md inline-block">
                  {store.totalBagsAvailable > 0 
                    ? `レスキューバッグ ${store.totalBagsAvailable}個あり` 
                    : '現在完売'}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
