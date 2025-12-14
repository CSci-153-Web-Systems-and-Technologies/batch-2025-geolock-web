'use client';

import { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon issue with Next.js
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

interface MapComponentProps {
  center: { lat: number; lng: number };
  radius: number;
  zoom?: number; // Added zoom prop
  onLocationChange: (lat: number, lng: number) => void;
}

// Helper to programmatically move AND zoom the map
function MapController({ center, zoom }: { center: { lat: number; lng: number }, zoom?: number }) {
  const map = useMap();
  
  useEffect(() => {
    // If zoom is provided, use it. Otherwise keep current zoom.
    const targetZoom = zoom || map.getZoom();
    map.flyTo([center.lat, center.lng], targetZoom, {
      duration: 1.5 // Smooth animation
    });
  }, [center, map, zoom]);

  return null;
}

function DraggableMarker({ center, onLocationChange }: { center: { lat: number; lng: number }, onLocationChange: (lat: number, lng: number) => void }) {
  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const { lat, lng } = marker.getLatLng();
        onLocationChange(lat, lng);
      }
    },
  };

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={[center.lat, center.lng]}
      ref={markerRef}
    />
  );
}

export default function MapComponent({ center, radius, zoom = 16, onLocationChange }: MapComponentProps) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController center={center} zoom={zoom} />
      <DraggableMarker center={center} onLocationChange={onLocationChange} />
      <Circle
        center={[center.lat, center.lng]}
        radius={radius}
        pathOptions={{
          color: '#004eec',
          fillColor: '#7ca8ff',
          fillOpacity: 0.35,
        }}
      />
    </MapContainer>
  );
}