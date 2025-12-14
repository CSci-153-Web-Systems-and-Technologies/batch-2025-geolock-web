'use client';

import React, { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import EventDetails, { DetailedEvent } from '@/components/features/events/event-details';
import { toast } from 'sonner';

interface EventDB {
  id: string;
  name: string;
  description: string | null;
  date: string;
  time: string;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  geofence_radius: number;
  capacity: number;
  status: 'upcoming' | 'active' | 'completed';
  event_code: string;
}

export default function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [event, setEvent] = useState<DetailedEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchEvent = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        const rawEvent = data as EventDB;
        
        // 1. Get the current Base URL (e.g., http://localhost:3000 or https://geolock.com)
        // We use window.location.origin, but fallback to empty string for SSR safety
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        
        // 2. Construct the actual URLs that the user will visit
        const checkInUrl = `${origin}/attend/${rawEvent.id}?type=check-in`;
        const checkOutUrl = `${origin}/attend/${rawEvent.id}?type=check-out`;

        const mappedEvent: DetailedEvent = {
          id: rawEvent.id,
          name: rawEvent.name,
          description: rawEvent.description || '',
          date: rawEvent.date,
          time: rawEvent.time,
          location: rawEvent.location_address || 'Unknown Location',
          geofenceRadius: rawEvent.geofence_radius || 50,
          attendeeCount: 0, 
          capacity: rawEvent.capacity || 0,
          status: rawEvent.status,
          eventCode: rawEvent.event_code,
          
          // 3. Generate QR Code Image URL that encodes the FULL URL
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(checkInUrl)}`,
          checkoutQrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(checkOutUrl)}`,
        };
        setEvent(mappedEvent);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    if (id) fetchEvent();
  }, [id, fetchEvent]);

  const handleUpdateEvent = async (updatedEvent: DetailedEvent) => {
    setEvent(updatedEvent);
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: updatedEvent.status })
        .eq('id', updatedEvent.id);

      if (error) throw error;
      toast.success("Event status updated");
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
      fetchEvent();
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm text-gray-500">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) return <div>Event not found</div>;

  return (
    <EventDetails 
      event={event} 
      onBack={() => router.push('/events')} 
      onUpdateEvent={handleUpdateEvent} 
    />
  );
}