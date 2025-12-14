'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, MoreHorizontal } from "lucide-react";

interface BreakdownData {
  name: string;
  value: number;
  color: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; 
}

interface AttendeesBreakdownProps {
  data?: BreakdownData[];
  totalUnique?: number;
  selectedYear?: string; // New prop to handle highlighting
}

export function AttendeesBreakdown({ 
  data = [], 
  totalUnique = 0, 
  selectedYear = "All" 
}: AttendeesBreakdownProps) {
  
  // Calculate percentage based on the currently displayed Total
  const getPercentage = (val: number) => {
    // If we are filtering, totalUnique might be small, so we might want to base % on the global total?
    // For now, let's base it on the current view's total so the selected bar looks full.
    if (totalUnique === 0) return 0;
    return Math.round((val / totalUnique) * 100);
  };

  return (
    <Card className="col-span-3 bg-white border-0 shadow-sm rounded-[20px] flex flex-col h-full">
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-gray-600 text-sm font-medium">Attendees</CardTitle>
        </div>
        <MoreHorizontal className="w-5 h-5 text-gray-400 cursor-pointer" />
      </CardHeader>
      
      <CardContent className="flex-1 min-h-0 pt-0">
        {/* Total Count */}
        <div className="flex items-start gap-2 mb-6 mt-1">
          <GraduationCap className="w-5 h-5 text-gray-800 mt-1" />
          <div className="text-4xl font-bold text-gray-800 tracking-tight">
            {totalUnique}
          </div>
        </div>

        <div className="w-full h-px bg-gray-100 mb-6" />

        {/* Year Level List */}
        <div className="space-y-6 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
          {data.length > 0 ? (
            data.map((item, index) => {
              // LOGIC: Is this item the selected one?
              const isSelected = selectedYear === "All" || item.name === selectedYear;
              
              return (
                <div 
                  key={index} 
                  className={`space-y-2 transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-40 grayscale'}`}
                >
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span className={`font-medium ${isSelected ? 'text-gray-900' : 'text-gray-400'}`}>
                      {item.name}
                    </span>
                    {isSelected && (
                       <span className="font-semibold text-gray-700">{item.value}</span>
                    )}
                  </div>
                  
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        // If not selected, show 0 width effectively (or maintain width but grayed out? 
                        // The user said "make it seem like no data is available", so 0 width or gray is good.
                        // Since the value passed in page.tsx is actually 0 for non-selected items, this will naturally be 0 width.
                        width: `${getPercentage(item.value)}%`,
                        backgroundColor: item.color || '#3B82F6' 
                      }} 
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-400 text-sm py-4">
              No attendee data available.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}