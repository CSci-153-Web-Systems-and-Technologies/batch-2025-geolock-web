'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Calendar, MapPin, LogIn, LogOut, Download, Plus, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge'; 

// 1. Interface for the Raw DB Row
// We add the 'attendees' field here to capture the count returned by the join
interface EventDB {
  id: string;
  name: string;
  description: string | null;
  date: string;
  time: string;
  location_address: string | null;
  capacity: number | null;
  status: 'upcoming' | 'active' | 'completed';
  // This captures the count query result: e.g. [{ count: 12 }]
  attendees?: { count: number }[]; 
}

// 2. Interface for the UI Component
interface Event {
  id: string | number;
  title: string;
  description: string;
  date: string;
  location: string;
  attendees: number;
  capacity: number;
  status: 'upcoming' | 'active' | 'completed'; 
}

interface EventCardProps {
  event: Event;
  onViewDetails: (eventId: string | number) => void;
  onExport: (eventId: string | number) => void;
}

// --- EVENT CARD COMPONENT ---
const EventCard: React.FC<EventCardProps> = ({ event, onViewDetails, onExport }) => {
  const progressPercentage = event.capacity > 0 ? (event.attendees / event.capacity) * 100 : 0;
  
  const getStatusColor = (s: string) => {
    switch(s) {
      case 'active': return 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200';
      default: return 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200';
    }
  };

  const getTopBorderColor = (s: string) => {
    switch(s) {
      case 'active': return 'border-t-green-500';
      case 'completed': return 'border-t-gray-400';
      default: return 'border-t-blue-500';
    }
  };

  return (
    <div 
      onClick={() => onViewDetails(event.id)}
      className={`bg-gray-50 border border-gray-200 border-t-4 ${getTopBorderColor(event.status)} 
                  rounded-bl-3xl rounded-br-none rounded-t-none 
                  p-5 mb-4 hover:shadow-md transition-all cursor-pointer relative group`}
    >
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        {/* Left Section */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-base font-semibold text-black group-hover:text-blue-600 transition-colors">
              {event.title}
            </h3>
            <Badge className={`${getStatusColor(event.status)} border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide shadow-none`}>
              {event.status}
            </Badge>
          </div>
          
          <p className="text-xs text-gray-500 mb-4 line-clamp-2">
            {event.description}
          </p>
          
          <div className="flex gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{event.location}</span>
            </div>
          </div>
        </div>
        
        {/* Right Section */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className="text-left">
            <div className="text-xl font-semibold">
              <span className="text-black">{event.attendees}</span>
              <span className="text-sm text-gray-400">/{event.capacity}</span>
            </div>
            <div className="text-xs font-medium text-gray-400 mb-2">
              attendees
            </div>
            <div className="w-24 h-2 bg-gray-300 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-2.5">
            <button
              onClick={(e) => { e.stopPropagation(); onViewDetails(event.id); }}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition-colors w-full justify-center z-10 relative"
            >
              <LogIn className="w-3 h-3" />
              Check In
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onViewDetails(event.id); }}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition-colors w-full justify-center z-10 relative"
            >
              <LogOut className="w-3 h-3" />
              Check Out
            </button>
          </div>
          
          <button
            onClick={(e) => { e.stopPropagation(); onExport(event.id); }}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-black text-xs font-medium px-4 py-2.5 rounded-lg shadow-sm border border-gray-200 transition-colors w-full justify-center md:w-auto z-10 relative"
          >
            <Download className="w-3 h-3" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

interface EventManagementProps {
  onOpenCreateModal: () => void;
}

export default function EventManagement({ onOpenCreateModal }: EventManagementProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    async function fetchEvents() {
      try {
        // UPDATE: Included ', attendees(count)' in the select query.
        // This asks Supabase to count rows in the 'attendees' table linked to each event.
        // Note: This relies on your foreign key relation being named 'attendees'. 
        // If your table is 'event_attendees', change this to 'event_attendees(count)'.
        const { data, error } = await supabase
          .from('events')
          .select('*, attendees(count)')
          .order('date', { ascending: true });

        if (error) throw error;

        if (data) {
          const mappedEvents: Event[] = data.map((e: EventDB) => ({
            id: e.id,
            title: e.name,
            description: e.description || '',
            date: `${e.date} at ${e.time}`,
            location: e.location_address || 'Unknown',
            // UPDATE: Extract the count from the returned array
            // Supabase returns an array of objects for counts, usually [{ count: n }]
            attendees: e.attendees?.[0]?.count || 0,
            capacity: e.capacity || 50,
            status: e.status || 'upcoming'
          }));
          setEvents(mappedEvents);
        }
      } catch (err) {
        console.error("Error loading events:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [supabase]);

  const handleNavigateToDetails = (eventId: string | number) => {
    router.push(`/events/${eventId}`);
  };

  const handleExport = (eventId: string | number) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      alert(`Exporting attendance data for: ${event.title}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-bl-3xl rounded-br-none rounded-t-none overflow-hidden">
      
      {/* Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-blue-600/30 to-blue-300/30 px-6 py-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-base font-semibold text-black mb-1">
              Your Events
            </h1>
            <p className="text-xs text-gray-600">
              Manage your events and track attendance with real-time monitoring
            </p>
          </div>
          
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white text-xs font-semibold px-6 py-3 rounded-lg shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            New Event
          </button>
        </div>
      </div>
      
      {/* Scrollable Events List */}
      <div className="flex-1 overflow-y-auto min-h-0 pl-6 pr-8 pt-8">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            <p>No events found. Create one to get started!</p>
          </div>
        ) : (
          <>
            {events.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onViewDetails={handleNavigateToDetails}
                onExport={handleExport}
              />
            ))}
            
            {/* Spacer to ensure bottom scrolling visibility */}
            <div className="h-5 w-full shrink-0" />
          </>
        )}
      </div>
    </div>
  );
}