'use client';

import React, { Suspense } from 'react';
import AttendeeView from '@/components/features/attendee/attendee-view';
import { Loader2 } from 'lucide-react';

export default function ScanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    }>
      <AttendeeView />
    </Suspense>
  );
}