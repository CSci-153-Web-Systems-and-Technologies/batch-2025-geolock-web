'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface EventFormData {
  name: string;
  description: string;
  date: string;
  time: string;
  location: { lat: number; lng: number; address: string };
  expectedAttendees: string;
  geofenceRadius: number;
}

interface CreateEventFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateEventForm({ onClose, onSuccess }: CreateEventFormProps) {
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    description: '',
    date: '',
    time: '',
    location: { lat: 11.3278, lng: 124.8095, address: 'VSU, Baybay City' },
    expectedAttendees: '',
    geofenceRadius: 50
  });

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);

  // Initialize Google Map
  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || typeof window === 'undefined' || !window.google) return;

      const map = new window.google.maps.Map(mapRef.current, {
        center: formData.location,
        zoom: 16,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      mapInstanceRef.current = map;

      const marker = new window.google.maps.Marker({
        position: formData.location,
        map: map,
        draggable: true,
        title: 'Event Location'
      });

      markerRef.current = marker;

      const circle = new window.google.maps.Circle({
        strokeColor: '#004eec',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#7ca8ff',
        fillOpacity: 0.35,
        map: map,
        center: formData.location,
        radius: formData.geofenceRadius,
      });

      circleRef.current = circle;

      marker.addListener('dragend', () => {
        const position = marker.getPosition();
        if (position) {
          const newLocation = {
            lat: position.lat(),
            lng: position.lng(),
            address: formData.location.address
          };
          setFormData(prev => ({ ...prev, location: newLocation }));
          circle.setCenter(position);
        }
      });
    };

    if (typeof window !== 'undefined' && !window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places`;
      script.async = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else if (window.google) {
      initMap();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(formData.geofenceRadius);
    }
  }, [formData.geofenceRadius]);

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, geofenceRadius: Number(e.target.value) }));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.date || !formData.time) {
      alert('Please fill in all required fields');
      return;
    }
    console.log('Event data:', formData);
    onSuccess();
    alert('Event created successfully!');
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
      onClose();
    }
  };

  return (
    <div className="flex justify-center items-start min-h-screen bg-transparent p-6 py-12">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="p-6 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-[15px] font-semibold text-black mb-2">
              Create New Event
            </h1>
            <p className="text-xs text-gray-500">
              Set up a new event with geofenced attendance tracking
            </p>
          </div>

          {/* Event Details Section */}
          <div className="mb-8">
            <h2 className="text-xs font-normal text-black mb-4">Event Details</h2>

            <div className="mb-5">
              <label className="block text-xs font-medium text-black mb-2">
                Event Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Team Meeting, Workshop, Conference..."
                className="w-full h-8 px-3 text-[9px] bg-gray-50 rounded-md border-0 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="mb-5">
              <label className="block text-xs font-medium text-black mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the event..."
                rows={3}
                className="w-full px-3 py-2 text-[9px] bg-gray-50 rounded-md border-0 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-medium text-black mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full h-7 px-2 text-[9px] text-gray-700 bg-gray-50 rounded-md border-0 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-black mb-2">
                  Time *
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full h-7 px-2 text-[9px] text-gray-700 bg-gray-50 rounded-md border-0 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-medium text-black mb-2">
                Event Location *
              </label>
              <div 
                ref={mapRef}
                className="w-full h-28 bg-gray-200 rounded-md overflow-hidden"
              />
              <p className="text-[9px] text-gray-500 mt-1">
                Drag the marker to set your event location
              </p>
            </div>

            <div className="mb-8">
              <label className="block text-xs font-medium text-black mb-2">
                Expected Attendees (Optional)
              </label>
              <input
                type="number"
                value={formData.expectedAttendees}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedAttendees: e.target.value }))}
                placeholder="How many people do you expect?"
                className="w-full h-8 px-3 text-[9px] bg-gray-50 rounded-md border-0 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 mb-6"></div>

          <div className="mb-6">
            <h2 className="text-xs font-normal text-black mb-2">Geolocking Settings</h2>
            <p className="text-xs text-gray-500 mb-4">
              Set the radius around your event location where attendees can check in
            </p>

            <div className="mb-3">
              <label className="block text-xs font-medium text-black mb-3">
                Geofenced Radius: {formData.geofenceRadius} meters
              </label>
              
              <div className="relative">
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={formData.geofenceRadius}
                  onChange={handleRadiusChange}
                  className="w-full h-3 bg-gray-300 rounded-full appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, rgba(0, 78, 236, 0.8) 0%, rgba(124, 168, 255, 0.8) ${(formData.geofenceRadius - 10) / 4.9}%, #e5e7eb ${(formData.geofenceRadius - 10) / 4.9}%, #e5e7eb 100%)`
                  }}
                />
              </div>
              
              <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                <span>10m (very tight)</span>
                <span>100m (building)</span>
                <span>500m (campus)</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mt-4">
              <h3 className="text-xs font-medium text-blue-900 mb-3">
                Geofenced Guidelines
              </h3>
              <ul className="space-y-2 text-[10px]">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-1">•</span>
                  <span>
                    <strong className="font-semibold text-blue-600">10-30m:</strong>
                    <span className="font-light text-black"> Single room or small area</span>
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-1">•</span>
                  <span>
                    <strong className="font-semibold text-blue-600">50-100m:</strong>
                    <span className="font-light text-black"> Building or floor level</span>
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-1">•</span>
                  <span>
                    <strong className="font-semibold text-blue-600">200-500m:</strong>
                    <span className="font-light text-black"> Campus or large venue</span>
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 my-6"></div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-9 py-2.5 text-xs font-semibold text-black bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg hover:from-blue-700 hover:to-blue-500 transition-all shadow-sm"
            >
              Create Event
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          background: white;
          border: 1px solid #0049dd;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-moz-range-thumb {
          width: 15px;
          height: 15px;
          border-radius: 50%;
          background: white;
          border: 1px solid #0049dd;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}