'use client';

import React, { use } from 'react';
import { useSearchParams } from 'next/navigation';
import AttendeeView from '@/components/features/attendee/attendee-view';

export default function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type'); 
  
  // Default to 'check-in' unless specifically 'check-out'
  const initialType = (typeParam === 'check-out' ? 'check-out' : 'check-in');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* FIX: Now AttendeeView accepts these props because we updated the interface in the file above 
      */}
      <AttendeeView eventId={id} initialType={initialType} />
    </div>
  );
}