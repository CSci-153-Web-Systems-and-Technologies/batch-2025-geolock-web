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
  selectedYear?: string;
  title?: string;
}

export function AttendeesBreakdown({ 
  data = [], 
  totalUnique = 0, 
  selectedYear = "All",
  title = "Attendees"
}: AttendeesBreakdownProps) {
  
  const getPercentage = (val: number) => {
    if (totalUnique === 0) return 0;
    return Math.round((val / totalUnique) * 100);
  };

  return (
    <Card className="col-span-3 bg-white border-0 shadow-sm rounded-[20px] flex flex-col h-full">
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-gray-600 text-sm font-medium">{title}</CardTitle>
        </div>
        <MoreHorizontal className="w-5 h-5 text-gray-400 cursor-pointer" />
      </CardHeader>
      
      <CardContent className="flex-1 min-h-0 pt-0">
        <div className="flex items-start gap-2 mb-6 mt-1">
          <GraduationCap className="w-5 h-5 text-gray-800 mt-1" />
          <div className="text-4xl font-bold text-gray-800 tracking-tight">
            {totalUnique}
          </div>
        </div>

        <div className="w-full h-px bg-gray-100 mb-6" />

        <div className="space-y-6 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
          {data.length > 0 ? (
            data.map((item, index) => {
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
              No data available.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}