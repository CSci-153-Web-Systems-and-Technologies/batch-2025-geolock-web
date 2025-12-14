'use client';

import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { X, Search, MapPin, Loader2, Navigation, Calendar, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

import 'leaflet/dist/leaflet.css';

// Ensure SSR is false to prevent server-side Leaflet crashes
const MapComponent = dynamic(() => import('./map-component'), { ssr: false });

interface EventFormData {
  name: string;
  description: string;
  date: string;
  time: string;
  location: { lat: number; lng: number; address: string };
  expectedAttendees: string;
  geofenceRadius: number;
}

interface LocationSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

interface CreateEventFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateEventForm({ onClose, onSuccess }: CreateEventFormProps) {
  const supabase = createClient();
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapZoom, setMapZoom] = useState(16);

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    description: '',
    date: '',
    time: '',
    location: { lat: 11.3278, lng: 124.8095, address: 'VSU, Baybay City' }, 
    expectedAttendees: '',
    geofenceRadius: 50
  });

  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          handleGetCurrentLocation();
        }
      });
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length > 2) {
        fetchSuggestions(searchQuery);
      } else {
        setSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: globalThis.MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    setLocationError(null);

    const options = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        if (accuracy > 50) {
          toast.warning(`Signal Weak (+/- ${Math.round(accuracy)}m)`, {
            description: "Position might be imprecise. Drag pin to refine.",
            duration: 4000
          });
        } else {
          toast.success("Location Found", {
            description: `Accuracy: +/- ${Math.round(accuracy)} meters`
          });
        }

        let address = "Current Location";
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.display_name) address = data.display_name;
        } catch (e) {
          console.error("Reverse geocode failed", e);
        }

        setFormData(prev => ({
          ...prev,
          location: { lat: latitude, lng: longitude, address: address }
        }));
        
        setMapZoom(19);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        switch(error.code) {
          case error.PERMISSION_DENIED: setLocationError("Location access denied. Please enable GPS."); break;
          case error.POSITION_UNAVAILABLE: setLocationError("Location unavailable. Try turning on GPS."); break;
          case error.TIMEOUT: setLocationError("Location request timed out. Please retry."); break;
          default: setLocationError("Could not retrieve location.");
        }
      },
      options
    );
  };

  const fetchSuggestions = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=ph&addressdetails=1`);
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  // Helper for Google-like short addresses
  const formatSuggestionLabel = (place: LocationSuggestion) => {
    if (place.address) {
      const main = place.address.road || place.address.village || place.display_name.split(',')[0];
      const secondary = place.address.city || place.address.town || place.address.state || '';
      return `${main}${secondary ? `, ${secondary}` : ''}`;
    }
    return place.display_name;
  };

  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    setFormData(prev => ({
      ...prev,
      location: { lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon), address: suggestion.display_name }
    }));
    setSearchQuery(formatSuggestionLabel(suggestion));
    setMapZoom(18);
    setShowSuggestions(false);
    setLocationError(null);
  };

  const handleRadiusChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, geofenceRadius: Number(e.target.value) }));
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      location: { lat, lng, address: "Custom Pin Location" }
    }));
    setLocationError(null);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.date || !formData.time) {
      toast.warning('Missing Information', {
        description: 'Please fill in all required fields marked with *'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const uniqueSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
      const eventCode = `EVT-${uniqueSuffix}`;

      const { error } = await supabase.from('events').insert({
        name: formData.name,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        location_address: formData.location.address,
        location_lat: formData.location.lat,
        location_lng: formData.location.lng,
        geofence_radius: formData.geofenceRadius,
        capacity: formData.expectedAttendees ? parseInt(formData.expectedAttendees) : 0,
        event_code: eventCode,
        status: 'upcoming'
      });

      if (error) throw error;

      toast.success('Event Created Successfully', {
        description: 'You successfully added a new event.',
        duration: 4000,
      });
      
      onSuccess(); 
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Submission Failed', {
        description: 'Could not create event. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center p-4 sm:p-0">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[85vh]">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors z-10">
          <X className="w-6 h-6 text-gray-500" />
        </button>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Create New Event</h1>
            <p className="text-sm text-gray-500">Set up a new event with geofenced attendance tracking</p>
          </div>

          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Event Details</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">Event Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Annual General Assembly"
                className="w-full h-11 px-4 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder:text-gray-400"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the event..."
                rows={4}
                className="w-full px-4 py-3 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none transition-all placeholder:text-gray-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Date *</label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.date}
                    onClick={(e) => e.currentTarget.showPicker()} 
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full h-11 pl-10 pr-4 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none cursor-pointer placeholder:text-gray-400"
                  />
                  <Calendar className="w-5 h-5 text-gray-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Time *</label>
                <div className="relative">
                  <input
                    type="time"
                    value={formData.time}
                    onClick={(e) => e.currentTarget.showPicker()}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full h-11 pl-10 pr-4 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none cursor-pointer placeholder:text-gray-400"
                  />
                  <Clock className="w-5 h-5 text-gray-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-end mb-2">
                <label className="block text-sm font-medium text-gray-900">Event Location *</label>
                <button 
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={isLocating}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1.5 font-semibold disabled:opacity-50 transition-colors py-1 px-2 hover:bg-blue-50 rounded"
                >
                  {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                  Use Accurate GPS
                </button>
              </div>

              <div className="relative mb-4" ref={searchContainerRef}>
                <div className="relative">
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                      setLocationError(null);
                    }}
                    onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
                    placeholder="Search location (e.g. VSU Library)..."
                    className="w-full h-11 pl-10 pr-4 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none placeholder:text-gray-400"
                  />
                  {isSearching ? <Loader2 className="w-5 h-5 text-gray-400 absolute left-3 top-3 animate-spin" /> : <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />}
                </div>
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {suggestions.map((place) => (
                      <button
                        key={place.place_id}
                        onClick={() => handleSelectSuggestion(place)}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-none flex flex-col items-start"
                      >
                        <div className="flex items-center gap-2 font-medium text-gray-900">
                          <MapPin className="w-4 h-4 text-blue-500" />
                          {formatSuggestionLabel(place)}
                        </div>
                        <span className="text-xs text-gray-500 pl-6 truncate w-full">{place.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className={`w-full h-64 rounded-lg overflow-hidden relative z-0 transition-colors ${locationError ? 'border-2 border-red-300' : 'border border-gray-200 bg-gray-200'}`}>
                <MapComponent 
                  center={formData.location} 
                  radius={formData.geofenceRadius} 
                  zoom={mapZoom} 
                  onLocationChange={handleLocationChange} 
                />
                
                {locationError && (
                  <div onClick={handleGetCurrentLocation} className="absolute inset-0 z-[1000] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 cursor-pointer hover:bg-white/90 transition-colors group">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-sm font-bold text-red-900 mb-1">{locationError}</h3>
                    <p className="text-xs text-red-700 mb-4">Please check your settings or try again.</p>
                    <button type="button" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-full shadow-sm flex items-center gap-2 transition-all">
                      <RefreshCw className="w-3 h-3" /> Retry GPS
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                <MapPin className={`w-4 h-4 ${locationError ? 'text-red-400' : 'text-blue-500'}`} />
                <span className="truncate max-w-[90%] font-medium text-gray-700">
                  {formData.location.address || "Coordinates selected"}
                  <span className="text-gray-400 ml-1 font-normal">({formData.location.lat.toFixed(4)}, {formData.location.lng.toFixed(4)})</span>
                </span>
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">Expected Attendees</label>
              <input
                type="number"
                value={formData.expectedAttendees}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedAttendees: e.target.value }))}
                placeholder="e.g. 50"
                className="w-full h-11 px-4 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 mb-6"></div>

          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wider">Geolocking Settings</h2>
            <p className="text-sm text-gray-500 mb-6">Set the radius around your event location where attendees can check in.</p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-4">Geofenced Radius: <span className="text-blue-600 font-bold">{formData.geofenceRadius} meters</span></label>
              <div className="relative px-2">
                <input type="range" min="10" max="500" step="10" value={formData.geofenceRadius} onChange={handleRadiusChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2 px-1"><span>10m</span><span>250m</span><span>500m</span></div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-xs font-bold text-blue-800 mb-2 uppercase">Geofence Guidelines</h3>
              <ul className="space-y-2 text-xs text-blue-900">
                <li className="flex items-start"><span className="mr-2">•</span> <strong>10-30m:</strong> Suitable for a single room.</li>
                <li className="flex items-start"><span className="mr-2">•</span> <strong>50-100m:</strong> Suitable for a large auditorium.</li>
                <li className="flex items-start"><span className="mr-2">•</span> <strong>200m+:</strong> Suitable for outdoor fields.</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 my-6"></div>

          <div className="flex justify-end gap-3 mt-8">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}