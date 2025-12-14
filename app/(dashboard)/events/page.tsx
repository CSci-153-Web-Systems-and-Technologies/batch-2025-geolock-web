'use client';

import React, { useState } from 'react';
import EventManagement from '@/components/features/events/event-management';
import CreateEventForm from '@/components/features/events/create-event-form';

export default function EventsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    // FIX: Added 'mt-[78px]' (header height) and 'p-8' (dashboard padding) 
    // to ensure uniform spacing with the Dashboard page.
    <div className="h-[calc(100vh-78px)] w-full relative mt-[78px] p-8">
      
      {/* Event Management Component */}
      <div className="h-full w-full bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
        <EventManagement 
          key={refreshKey} 
          onOpenCreateModal={() => setIsCreateModalOpen(true)} 
        />
      </div>
      
      {/* Modal Overlay */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsCreateModalOpen(false)}
          />
          
          <div className="relative z-10 w-full h-full sm:h-auto flex justify-center pointer-events-none">
            <div className="pointer-events-auto w-full max-w-2xl">
              <CreateEventForm 
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                  setIsCreateModalOpen(false);
                  setRefreshKey(prev => prev + 1); 
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}