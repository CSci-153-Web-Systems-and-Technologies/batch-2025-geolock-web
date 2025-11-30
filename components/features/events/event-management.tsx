'use client';

import React, { useState } from 'react';
import { Calendar, MapPin, UserCheck, LogOut, Download, Plus } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  attendees: number;
  capacity: number;
}

interface EventCardProps {
  event: Event;
  onCheckIn: (eventId: number) => void;
  onCheckOut: (eventId: number) => void;
  onExport: (eventId: number) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onCheckIn, onCheckOut, onExport }) => {
  const progressPercentage = (event.attendees / event.capacity) * 100;
  
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-4">
      <div className="flex justify-between items-start">
        {/* Left Section - Event Details */}
        <div className="flex-1">
          <h3 className="text-base font-semibold text-black mb-2">
            {event.title}
          </h3>
          <p className="text-xs text-gray-500 mb-4">
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
        
        {/* Right Section - Attendance & Actions */}
        <div className="flex items-center gap-4">
          {/* Attendance Counter */}
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
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => onCheckIn(event.id)}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              <UserCheck className="w-3 h-3" />
              Check In
            </button>
            <button
              onClick={() => onCheckOut(event.id)}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              <LogOut className="w-3 h-3" />
              Check Out
            </button>
          </div>
          
          {/* Export Button */}
          <button
            onClick={() => onExport(event.id)}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-black text-xs font-medium px-4 py-2.5 rounded-lg shadow-sm border border-gray-200 transition-colors"
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
  const [events, setEvents] = useState<Event[]>([
    {
      id: 1,
      title: 'General Assembly 2025',
      description: 'Semestral meeting to go back on what had transpired last semester',
      date: '2025-09-14 at 10:00 AM',
      location: 'VSU RDE Hall',
      attendees: 12,
      capacity: 15
    },
    {
      id: 2,
      title: 'General Assembly 2025',
      description: 'Semestral meeting to go back on what had transpired last semester',
      date: '2025-09-14 at 10:00 AM',
      location: 'VSU RDE Hall',
      attendees: 0,
      capacity: 50
    },
    {
      id: 3,
      title: 'General Assembly 2025',
      description: 'Semestral meeting to go back on what had transpired last semester',
      date: '2025-09-14 at 10:00 AM',
      location: 'VSU RDE Hall',
      attendees: 10,
      capacity: 20
    },
    {
      id: 4,
      title: 'General Assembly 2025',
      description: 'Semestral meeting to go back on what had transpired last semester',
      date: '2025-09-14 at 10:00 AM',
      location: 'VSU RDE Hall',
      attendees: 10,
      capacity: 20
    },
    {
      id: 5,
      title: 'General Assembly 2025',
      description: 'Semestral meeting to go back on what had transpired last semester',
      date: '2025-09-14 at 10:00 AM',
      location: 'VSU RDE Hall',
      attendees: 8,
      capacity: 20
    },
    {
      id: 6,
      title: 'General Assembly 2025',
      description: 'Semestral meeting to go back on what had transpired last semester',
      date: '2025-09-14 at 10:00 AM',
      location: 'VSU RDE Hall',
      attendees: 15,
      capacity: 20
    }
  ]);

  const handleCheckIn = (eventId: number) => {
    setEvents(events.map(event => 
      event.id === eventId && event.attendees < event.capacity
        ? { ...event, attendees: event.attendees + 1 }
        : event
    ));
  };

  const handleCheckOut = (eventId: number) => {
    setEvents(events.map(event => 
      event.id === eventId && event.attendees > 0
        ? { ...event, attendees: event.attendees - 1 }
        : event
    ));
  };

  const handleExport = (eventId: number) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      alert(`Exporting attendance data for: ${event.title}`);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      {/* Fixed Header */}
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
      
      {/* Scrollable Events List with Asymmetric Padding */}
      <div className="flex-1 overflow-y-auto pl-6 pr-8 pt-8 pb-6">
        {events.map(event => (
          <EventCard
            key={event.id}
            event={event}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            onExport={handleExport}
          />
        ))}
      </div>
    </div>
  );
}