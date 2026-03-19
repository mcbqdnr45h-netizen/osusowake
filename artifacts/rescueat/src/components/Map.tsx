import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Store } from '@workspace/api-client-react';
import { getCategoryIcon } from './BagCard';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { Navigation, LocateFixed } from 'lucide-react';

interface MapViewProps {
  stores: Store[];
  center?: [number, number];
  zoom?: number;
  userPosition?: [number, number] | null;
}

function ClusteredMarkers({ stores }: { stores: Store[] }) {
  const map = useMap();

  useEffect(() => {
    // @ts-ignore
    const markers = L.markerClusterGroup({
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        const size = count >= 10 ? 48 : 40;
        return L.divIcon({
          html: `<div style="background:#2D5A51;color:white;border-radius:50%;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${count}</div>`,
          className: '',
          iconSize: [size, size],
        });
      },
      maxClusterRadius: 60,
    });

    stores.forEach(store => {
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="width:40px;height:40px;background:white;border-radius:50%;border:2.5px solid #2D5A51;box-shadow:0 2px 8px rgba(45,90,81,0.4);display:flex;align-items:center;justify-content:center;font-size:18px">${getCategoryIcon(store.category)}</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -44],
      });
      const marker = L.marker([store.lat, store.lng], { icon });
      marker.bindPopup(`
        <div style="font-family:'Noto Sans JP',sans-serif;padding:8px;min-width:180px">
          <strong style="font-size:14px;display:block;margin-bottom:4px;line-height:1.3">${store.name}</strong>
          <div style="font-size:12px;color:#666;margin-bottom:8px">${store.address}</div>
          <div style="font-size:12px;font-weight:bold;color:white;background:#2D5A51;padding:6px 10px;border-radius:6px;text-align:center">
            ${store.totalBagsAvailable > 0 ? `🛍 バッグ ${store.totalBagsAvailable}個あり` : '現在完売'}
          </div>
        </div>
      `);
      markers.addLayer(marker);
    });

    map.addLayer(markers);
    return () => { map.removeLayer(markers); };
  }, [map, stores]);

  return null;
}

function UserMarker({ position }: { position: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:18px;height:18px;background:#3B82F6;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3)"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    const marker = L.marker(position, { icon, zIndexOffset: 1000 });
    marker.bindPopup('<div style="font-family:sans-serif;font-size:13px;font-weight:bold">📍 現在地</div>');
    marker.addTo(map);
    return () => { marker.remove(); };
  }, [map, position]);

  return null;
}

function FlyToUser({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, 14, { duration: 1.5 });
  }, [map, position]);
  return null;
}

function LocateControl({ onLocate }: { onLocate: (pos: [number, number]) => void }) {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleLocate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          onLocate(latlng);
          map.flyTo(latlng, 14, { duration: 1.5 });
          setLocating(false);
        },
        () => {
          map.locate().on('locationfound', (e: any) => {
            const latlng: [number, number] = [e.latlng.lat, e.latlng.lng];
            onLocate(latlng);
            map.flyTo(latlng, 14, { duration: 1.5 });
          });
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  return (
    <button
      onClick={handleLocate}
      className="absolute bottom-6 right-6 z-[1000] w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 border border-gray-200 active:scale-95 transition-all"
      style={{ touchAction: 'none' }}
      title="現在地へ移動"
    >
      {locating
        ? <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        : <LocateFixed className="w-5 h-5 text-primary" />
      }
    </button>
  );
}

export function MapView({ stores, center = [34.7856, 135.4380], zoom = 12, userPosition }: MapViewProps) {
  const [mounted, setMounted] = useState(false);
  const [currentUserPos, setCurrentUserPos] = useState<[number, number] | null>(userPosition ?? null);
  const [autoFlown, setAutoFlown] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (userPosition) {
      setCurrentUserPos(userPosition);
    }
  }, [userPosition]);

  if (!mounted) return <div className="w-full h-full bg-muted animate-pulse rounded" />;

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={currentUserPos ?? center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClusteredMarkers stores={stores} />
        {currentUserPos && <UserMarker position={currentUserPos} />}
        {currentUserPos && !autoFlown && (
          <FlyToUser position={currentUserPos} />
        )}
        <LocateControl onLocate={(pos) => { setCurrentUserPos(pos); setAutoFlown(true); }} />
      </MapContainer>
    </div>
  );
}
