import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Store } from '@workspace/api-client-react';
import { getCategoryIcon } from './BagCard';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { Navigation } from 'lucide-react';

interface MapViewProps {
  stores: Store[];
  center?: [number, number];
  zoom?: number;
}

function ClusteredMarkers({ stores }: { stores: Store[] }) {
  const map = useMap();

  useEffect(() => {
    // @ts-ignore
    const markers = L.markerClusterGroup({
      iconCreateFunction: (cluster: any) => {
        return L.divIcon({
          html: `<div style="background:#2D5A51;color:white;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${cluster.getChildCount()}</div>`,
          className: '',
          iconSize: [40, 40],
        });
      },
      maxClusterRadius: 60,
    });

    stores.forEach(store => {
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div class="w-10 h-10 bg-white text-foreground rounded-full border-2 border-primary shadow-lg flex items-center justify-center text-xl shadow-primary/40">${getCategoryIcon(store.category)}</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
      });
      const marker = L.marker([store.lat, store.lng], { icon });
      marker.bindPopup(`
        <div class="font-sans p-3 min-w-[180px]">
          <strong class="text-base text-foreground block mb-1 leading-tight">${store.name}</strong>
          <div class="text-sm text-muted-foreground mb-3">${store.address}</div>
          <div class="text-xs font-bold text-white bg-primary px-2.5 py-1.5 rounded-md inline-block w-full text-center shadow-sm">
            ${store.totalBagsAvailable > 0 ? `レスキューバッグ ${store.totalBagsAvailable}個あり` : '現在完売'}
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

function LocateControl() {
  const map = useMap();
  return (
    <button 
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        map.locate().on("locationfound", function (e) {
          map.flyTo(e.latlng, map.getZoom());
        });
      }}
      className="absolute bottom-6 right-6 z-[1000] w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-primary hover:bg-gray-50 border border-border"
    >
      <Navigation className="w-5 h-5 fill-current" />
    </button>
  );
}

export function MapView({ stores, center = [34.7856, 135.4380], zoom = 12 }: MapViewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-full h-full bg-muted animate-pulse" />;

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClusteredMarkers stores={stores} />
        <LocateControl />
      </MapContainer>
    </div>
  );
}
