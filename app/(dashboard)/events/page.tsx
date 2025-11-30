'use client';

import React, { useState } from 'react';
import EventManagement from '@/components/features/events/event-management';
import CreateEventForm from '@/components/features/events/create-event-form';

export default function EventsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="p-8">
      <h1 className="text-[20px] font-medium text-white mb-6">Events</h1>
      <EventManagement onOpenCreateModal={() => setIsCreateModalOpen(true)} />
      
      {/* Modal Overlay */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop - Blurred Background */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsCreateModalOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative z-10 w-full h-full overflow-y-auto">
            <CreateEventForm 
              onClose={() => setIsCreateModalOpen(false)}
              onSuccess={() => {
                setIsCreateModalOpen(false);
                // Refresh events list here if needed
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}