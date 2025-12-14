"use client";

import { useState, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for Leaflet default icons in Next.js
const iconUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png";

const customIcon = new L.Icon({
  iconUrl: iconUrl,
  iconRetinaUrl: iconRetinaUrl,
  shadowUrl: shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function HeroMap() {
  // Default: Coordinates for City of Baybay, Leyte (based on your context)
  // or generic coordinates if you prefer.
  const defaultPosition: [number, number] = [10.6765, 124.8006]; 
  
  const [position, setPosition] = useState(defaultPosition);
  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const { lat, lng } = marker.getLatLng();
          setPosition([lat, lng]);
        }
      },
    }),
    [],
  );

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        center={defaultPosition}
        zoom={15}
        scrollWheelZoom={false}
        className="h-full w-full"
        style={{ height: "100%", width: "100%", zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Visualizing the "Geofence" */}
        <Circle 
          center={position} 
          radius={150} 
          pathOptions={{ fillColor: '#004eec', color: '#004eec', opacity: 0.5, fillOpacity: 0.2 }} 
        />

        <Marker 
          draggable={true} 
          eventHandlers={eventHandlers} 
          position={position} 
          ref={markerRef}
          icon={customIcon}
        >
          <Popup minWidth={90}>
            <div className="text-center">
              <span className="font-semibold text-gray-900">Active Geofence</span>
              <br />
              <span className="text-xs text-gray-500">Drag to move zone</span>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Overlay Badge */}
      <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur px-3 py-1.5 rounded-md shadow-md text-xs font-medium text-gray-600 pointer-events-none border border-gray-200">
        Interactive Preview
      </div>
    </div>
  );
}